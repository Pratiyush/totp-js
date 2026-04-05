/**
 * totp-js — Security-hardened TOTP/2FA library for JavaScript and TypeScript.
 *
 * @packageDocumentation
 */

// Main class
export { TOTP } from './totp.js';
export type { VerificationResult, TOTPOptions } from './totp.js';

// Configuration
export { defaultConfig, sha256Config, highSecurityConfig, createConfig } from './config.js';
export type { TOTPConfig } from './config.js';

// Algorithm
export { Algorithm, algorithmFromName, recommendedSecretLength } from './algorithm.js';
export type { AlgorithmDef, AlgorithmKey, AlgorithmValue } from './algorithm.js';

// Secret generation
export { generateSecret, generateSecretBytes, generateRawSecret, isValidSecret, entropyBits } from './secret-generator.js';

// Replay protection
export { InMemoryReplayGuard } from './replay-guard.js';
export type { ReplayGuard } from './replay-guard.js';

// Errors
export { TOTPError, ErrorCode } from './errors.js';

// URI building (for QR codes)
export { buildOtpauthUri } from './uri.js';
