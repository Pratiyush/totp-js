/**
 * OTPAuth URI builder for QR code generation.
 * Follows the otpauth:// URI format used by Google Authenticator and other apps.
 */
import { type TOTPConfig, defaultConfig } from './config.js';

export function buildOtpauthUri(
  secret: string,
  account: string,
  issuer: string,
  config: TOTPConfig = defaultConfig(),
): string {
  if (!secret) throw new Error('Secret is required');
  if (!account) throw new Error('Account is required');
  if (!issuer) throw new Error('Issuer is required');

  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: config.algorithm.otpauthName,
    digits: config.digits.toString(),
    period: config.period.toString(),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}
