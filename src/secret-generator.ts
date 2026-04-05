/**
 * Cryptographically secure secret generation for TOTP.
 */
import { randomBytes } from 'node:crypto';
import { encode, isValid } from './internal/base32.js';
import { Algorithm, type AlgorithmValue } from './algorithm.js';

const MIN_SECRET_BYTES = 16;

export function generateSecret(algo: AlgorithmValue = Algorithm.SHA1): string {
  return generateSecretBytes(algo.recommendedKeyBytes);
}

export function generateSecretBytes(lengthBytes: number = 20): string {
  if (lengthBytes < MIN_SECRET_BYTES) {
    throw new Error(`Secret length must be at least ${MIN_SECRET_BYTES} bytes, got ${lengthBytes}`);
  }
  const bytes = randomBytes(lengthBytes);
  return encode(new Uint8Array(bytes));
}

export function generateRawSecret(lengthBytes: number = 20): Uint8Array {
  if (lengthBytes < MIN_SECRET_BYTES) {
    throw new Error(`Secret length must be at least ${MIN_SECRET_BYTES} bytes, got ${lengthBytes}`);
  }
  return new Uint8Array(randomBytes(lengthBytes));
}

export function isValidSecret(base32Secret: string): boolean {
  if (!base32Secret || base32Secret.length < 26) return false;
  return isValid(base32Secret);
}

export function entropyBits(base32Length: number): number {
  return base32Length * 5;
}
