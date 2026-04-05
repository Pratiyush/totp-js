/**
 * Main TOTP class — the primary public API.
 */
import { decode } from './internal/base32.js';
import { generateCode, verifyCode, validateBase32Secret } from './internal/engine.js';
import { type TOTPConfig, defaultConfig, createConfig } from './config.js';
import type { ReplayGuard } from './replay-guard.js';
import type { AlgorithmValue } from './algorithm.js';

export interface VerificationResult {
  readonly valid: boolean;
  readonly timeOffset: number;
  readonly message: string;
}

export interface TOTPOptions {
  algorithm?: AlgorithmValue;
  digits?: number;
  period?: number;
  allowedDrift?: number;
  replayGuard?: ReplayGuard;
  clock?: () => number; // Returns current time in milliseconds
}

export class TOTP {
  readonly config: TOTPConfig;
  private readonly replayGuard: ReplayGuard | undefined;
  private readonly clock: () => number;

  private constructor(config: TOTPConfig, replayGuard?: ReplayGuard, clock?: () => number) {
    this.config = config;
    this.replayGuard = replayGuard;
    this.clock = clock ?? (() => Date.now());
  }

  static create(options: TOTPOptions = {}): TOTP {
    const { replayGuard, clock, ...configOpts } = options;
    const config = createConfig(configOpts);
    return new TOTP(config, replayGuard, clock);
  }

  static defaultInstance(): TOTP {
    return new TOTP(defaultConfig());
  }

  generate(base32Secret: string): string {
    validateBase32Secret(base32Secret);
    const secret = decode(base32Secret);
    const counter = this.getCurrentCounter();
    return generateCode(secret, counter, this.config.algorithm.jcaName, this.config.digits);
  }

  generateAt(base32Secret: string, timestamp: number): string {
    validateBase32Secret(base32Secret);
    const secret = decode(base32Secret);
    const counter = Math.floor(timestamp / 1000 / this.config.period);
    return generateCode(secret, counter, this.config.algorithm.jcaName, this.config.digits);
  }

  generateForCounter(base32Secret: string, counter: number): string {
    validateBase32Secret(base32Secret);
    const secret = decode(base32Secret);
    return generateCode(secret, counter, this.config.algorithm.jcaName, this.config.digits);
  }

  verify(base32Secret: string, code: string, userId?: string): boolean {
    const result = this.verifyWithDetails(base32Secret, code, userId);
    return result.valid;
  }

  verifyWithDetails(base32Secret: string, code: string, userId?: string): VerificationResult {
    validateBase32Secret(base32Secret);
    const secret = decode(base32Secret);
    const currentCounter = this.getCurrentCounter();

    const { valid, timeOffset } = verifyCode(secret, code, this.config, currentCounter);

    if (!valid) {
      return { valid: false, timeOffset: 0, message: 'Invalid code' };
    }

    // Replay protection
    if (this.replayGuard && userId) {
      const replayKey = `${userId}:${code}:${currentCounter + timeOffset}`;
      if (!this.replayGuard.markUsed(replayKey)) {
        return { valid: false, timeOffset, message: 'Code already used' };
      }
    }

    return { valid: true, timeOffset, message: 'Valid' };
  }

  getCurrentCounter(): number {
    return Math.floor(this.clock() / 1000 / this.config.period);
  }

  getSecondsRemaining(): number {
    const seconds = Math.floor(this.clock() / 1000);
    return this.config.period - (seconds % this.config.period);
  }
}
