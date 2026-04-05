import { describe, it, expect } from 'vitest';
import { generateSecret, generateSecretBytes, generateRawSecret, isValidSecret, entropyBits } from '../src/secret-generator.js';
import { Algorithm } from '../src/algorithm.js';
import { isValid } from '../src/internal/base32.js';

describe('SecretGenerator', () => {
  it('should generate valid Base32 secrets', () => {
    const secret = generateSecret();
    expect(isValid(secret)).toBe(true);
    expect(secret.length).toBeGreaterThanOrEqual(32); // 20 bytes = 32 base32 chars
  });

  it('should generate different secrets each time', () => {
    const secrets = new Set(Array.from({ length: 100 }, () => generateSecret()));
    expect(secrets.size).toBe(100);
  });

  it('should generate correct length for each algorithm', () => {
    const sha1 = generateSecret(Algorithm.SHA1);
    const sha256 = generateSecret(Algorithm.SHA256);
    const sha512 = generateSecret(Algorithm.SHA512);

    // SHA1: 20 bytes, SHA256: 32 bytes, SHA512: 64 bytes
    expect(sha1.length).toBe(32);   // ceil(20 * 8 / 5) = 32
    expect(sha256.length).toBeGreaterThanOrEqual(52); // ceil(32 * 8 / 5) = 52
    expect(sha512.length).toBeGreaterThanOrEqual(103); // ceil(64 * 8 / 5) = 103
  });

  it('should reject secrets shorter than 16 bytes', () => {
    expect(() => generateSecretBytes(15)).toThrow('at least 16 bytes');
  });

  it('should generate raw bytes', () => {
    const raw = generateRawSecret(20);
    expect(raw).toBeInstanceOf(Uint8Array);
    expect(raw.length).toBe(20);
  });

  describe('isValidSecret', () => {
    it('should accept valid secrets', () => {
      expect(isValidSecret(generateSecret())).toBe(true);
    });

    it('should reject short secrets', () => {
      expect(isValidSecret('ABC')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(isValidSecret('')).toBe(false);
    });
  });

  describe('entropyBits', () => {
    it('should calculate entropy correctly', () => {
      expect(entropyBits(32)).toBe(160); // SHA1
      expect(entropyBits(52)).toBe(260); // SHA256
    });
  });
});
