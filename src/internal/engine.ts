/**
 * Core TOTP/HOTP engine implementing RFC 6238 and RFC 4226.
 * @internal
 */

import { computeHmac } from './hmac.js';
import type { TOTPConfig } from '../config.js';
import { timingSafeEqual } from 'node:crypto';

const POWERS_OF_TEN = [1, 10, 100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000, 100_000_000];

export function generateCode(
  secret: Uint8Array,
  counter: number,
  algorithm: string,
  digits: number,
): string {
  validateSecret(secret);

  // Step 1: Convert counter to 8-byte big-endian
  const counterBytes = new Uint8Array(8);
  const view = new DataView(counterBytes.buffer);
  view.setBigUint64(0, BigInt(counter));

  // Step 2: Compute HMAC
  const hash = computeHmac(algorithm, secret, counterBytes);

  // Step 3: Dynamic truncation (RFC 4226 section 5.4)
  const offset = hash[hash.length - 1]! & 0x0f;
  const binary =
    ((hash[offset]! & 0x7f) << 24) |
    ((hash[offset + 1]! & 0xff) << 16) |
    ((hash[offset + 2]! & 0xff) << 8) |
    (hash[offset + 3]! & 0xff);

  // Step 4: Compute OTP
  const otp = binary % POWERS_OF_TEN[digits]!;

  // Step 5: Pad with leading zeros
  return otp.toString().padStart(digits, '0');
}

export function verifyCode(
  secret: Uint8Array,
  code: string,
  config: TOTPConfig,
  currentCounter: number,
): { valid: boolean; timeOffset: number } {
  if (!isValidCodeFormat(code, config.digits)) {
    return { valid: false, timeOffset: 0 };
  }

  let valid = false;
  let matchOffset = 0;

  // Check all drift windows for constant-time behavior
  for (let i = -config.allowedDrift; i <= config.allowedDrift; i++) {
    const expected = generateCode(secret, currentCounter + i, config.algorithm.jcaName, config.digits);
    if (constantTimeEquals(code, expected)) {
      valid = true;
      matchOffset = i;
      // Do NOT return early — constant-time requires checking all windows
    }
  }

  return { valid, timeOffset: matchOffset };
}

export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  return timingSafeEqual(bufA, bufB);
}

export function validateSecret(secret: Uint8Array): void {
  if (secret.length < 16) {
    throw new Error('Secret must be at least 16 bytes (128 bits)');
  }
}

export function validateBase32Secret(base32: string): void {
  if (!base32 || base32.length < 26) {
    throw new Error('Base32 secret must be at least 26 characters');
  }
}

export function isValidCodeFormat(code: string, digits: number): boolean {
  if (!code || code.length !== digits) return false;
  for (let i = 0; i < code.length; i++) {
    const c = code.charCodeAt(i);
    if (c < 48 || c > 57) return false; // not 0-9
  }
  return true;
}
