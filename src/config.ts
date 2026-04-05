/**
 * Immutable TOTP configuration.
 */
import { Algorithm, type AlgorithmValue } from './algorithm.js';

export interface TOTPConfig {
  readonly algorithm: AlgorithmValue;
  readonly digits: number;
  readonly period: number;
  readonly allowedDrift: number;
}

const MIN_PERIOD = 15;
const MAX_PERIOD = 120;
const MIN_DIGITS = 6;
const MAX_DIGITS = 8;
const MAX_DRIFT = 5;

export function defaultConfig(): TOTPConfig {
  return { algorithm: Algorithm.SHA1, digits: 6, period: 30, allowedDrift: 1 };
}

export function sha256Config(): TOTPConfig {
  return { algorithm: Algorithm.SHA256, digits: 6, period: 30, allowedDrift: 1 };
}

export function highSecurityConfig(): TOTPConfig {
  return { algorithm: Algorithm.SHA512, digits: 8, period: 30, allowedDrift: 1 };
}

export function createConfig(options: Partial<TOTPConfig> = {}): TOTPConfig {
  const config: TOTPConfig = { ...defaultConfig(), ...options };
  validateConfig(config);
  return config;
}

function validateConfig(config: TOTPConfig): void {
  if (config.period < MIN_PERIOD || config.period > MAX_PERIOD) {
    throw new Error(`Period must be between ${MIN_PERIOD} and ${MAX_PERIOD} seconds, got ${config.period}`);
  }
  if (config.digits < MIN_DIGITS || config.digits > MAX_DIGITS) {
    throw new Error(`Digits must be between ${MIN_DIGITS} and ${MAX_DIGITS}, got ${config.digits}`);
  }
  if (config.allowedDrift < 0 || config.allowedDrift > MAX_DRIFT) {
    throw new Error(`Allowed drift must be between 0 and ${MAX_DRIFT}, got ${config.allowedDrift}`);
  }
}
