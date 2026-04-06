/**
 * QR code generation for otpauth URIs.
 *
 * Requires the optional `qrcode` package:
 * @example npm install qrcode
 *
 * @module totp-js/qr
 */
import { buildOtpauthUri } from './uri.js';
import type { TOTPConfig } from './config.js';

export type QRCodeFormat = 'buffer' | 'base64' | 'svg';

export interface QRCodeOptions {
  /** Output format: 'buffer' (PNG Buffer), 'base64' (data URI), or 'svg'. Defaults to 'base64'. */
  format?: QRCodeFormat;
  /** TOTP config to pass to buildOtpauthUri */
  config?: TOTPConfig;
  /** Error correction level. Defaults to 'M'. */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  /** Image width in pixels (for 'buffer' and 'base64'). Defaults to 200. */
  width?: number;
}

export interface QRCodeResult {
  /** The format of the returned data */
  format: QRCodeFormat;
  /** PNG Buffer, base64 data URI string, or SVG string depending on format */
  data: Buffer | string;
  /** The otpauth URI encoded in the QR code */
  uri: string;
}

async function loadQRCode(): Promise<typeof import('qrcode')> {
  try {
    return await import('qrcode');
  } catch {
    throw new Error(
      'Package "qrcode" is required for QR code generation. ' +
        'Install it with: npm install qrcode',
    );
  }
}

/**
 * Generates a QR code for a TOTP otpauth URI.
 *
 * @param secret - Base32-encoded TOTP secret
 * @param account - Account identifier (e.g. user email)
 * @param issuer - Service/issuer name (e.g. "MyApp")
 * @param options - Output format and QR options
 * @returns QRCodeResult with the generated data and the otpauth URI
 *
 * @example
 * // Base64 data URI (default) — embed directly in an <img> tag
 * const { data } = await generateQRCode('JBSWY3DPEHPK3PXP', 'user@example.com', 'MyApp');
 * // <img src={data} />
 *
 * @example
 * // PNG Buffer
 * const { data } = await generateQRCode('JBSWY3DPEHPK3PXP', 'user@example.com', 'MyApp', { format: 'buffer' });
 *
 * @example
 * // SVG string
 * const { data } = await generateQRCode('JBSWY3DPEHPK3PXP', 'user@example.com', 'MyApp', { format: 'svg' });
 */
export async function generateQRCode(
  secret: string,
  account: string,
  issuer: string,
  options: QRCodeOptions = {},
): Promise<QRCodeResult> {
  const { format = 'base64', config, errorCorrectionLevel = 'M', width = 200 } = options;

  const uri = buildOtpauthUri(secret, account, issuer, config);
  const qrcode = await loadQRCode();

  let data: Buffer | string;

  if (format === 'buffer') {
    data = await qrcode.toBuffer(uri, { errorCorrectionLevel, width });
  } else if (format === 'svg') {
    data = await qrcode.toString(uri, { errorCorrectionLevel, width, type: 'svg' });
  } else {
    data = await qrcode.toDataURL(uri, { errorCorrectionLevel, width });
  }

  return { format, data, uri };
}

/**
 * Saves a TOTP QR code directly to a file.
 * The file format is inferred from the file extension (e.g. `.png`, `.svg`).
 *
 * @param filePath - Destination file path
 * @param secret - Base32-encoded TOTP secret
 * @param account - Account identifier
 * @param issuer - Service/issuer name
 * @param options - QR options (format is inferred from file extension)
 * @returns The otpauth URI encoded in the QR code
 *
 * @example
 * const uri = await saveQRCodeToFile('./qr.png', 'JBSWY3DPEHPK3PXP', 'user@example.com', 'MyApp');
 */
export async function saveQRCodeToFile(
  filePath: string,
  secret: string,
  account: string,
  issuer: string,
  options: Omit<QRCodeOptions, 'format'> = {},
): Promise<string> {
  const { config, errorCorrectionLevel = 'M', width = 200 } = options;

  const uri = buildOtpauthUri(secret, account, issuer, config);
  const qrcode = await loadQRCode();

  await qrcode.toFile(filePath, uri, { errorCorrectionLevel, width });

  return uri;
}
