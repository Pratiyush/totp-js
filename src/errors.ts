/**
 * Structured error types for totp-js.
 */

export enum ErrorCode {
  INVALID_SECRET = 'INVALID_SECRET',
  INVALID_CODE = 'INVALID_CODE',
  INVALID_CONFIG = 'INVALID_CONFIG',
  HMAC_ERROR = 'HMAC_ERROR',
  QR_GENERATION_ERROR = 'QR_GENERATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class TOTPError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string, cause?: Error) {
    super(message, { cause });
    this.code = code;
    this.name = 'TOTPError';
  }

  static invalidSecret(reason: string): TOTPError {
    return new TOTPError(ErrorCode.INVALID_SECRET, `Invalid secret: ${reason}`);
  }

  static invalidCode(reason: string): TOTPError {
    return new TOTPError(ErrorCode.INVALID_CODE, `Invalid code: ${reason}`);
  }

  static invalidConfig(reason: string): TOTPError {
    return new TOTPError(ErrorCode.INVALID_CONFIG, `Invalid configuration: ${reason}`);
  }

  static hmacError(cause: Error): TOTPError {
    return new TOTPError(ErrorCode.HMAC_ERROR, 'HMAC computation failed', cause);
  }

  static internalError(message: string, cause?: Error): TOTPError {
    return new TOTPError(ErrorCode.INTERNAL_ERROR, message, cause);
  }
}
