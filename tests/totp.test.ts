import { describe, it, expect } from 'vitest';
import { TOTP, Algorithm, generateSecret, InMemoryReplayGuard, sha256Config, highSecurityConfig, defaultConfig } from '../src/index.js';
import { encode } from '../src/internal/base32.js';

// RFC 6238 test secret: "12345678901234567890" (ASCII) → Base32
const RFC_SECRET_SHA1 = encode(new TextEncoder().encode('12345678901234567890'));
// SHA256 uses 32-byte key: "12345678901234567890123456789012"
const RFC_SECRET_SHA256 = encode(new TextEncoder().encode('12345678901234567890123456789012'));
// SHA512 uses 64-byte key: "1234567890123456789012345678901234567890123456789012345678901234"
const RFC_SECRET_SHA512 = encode(new TextEncoder().encode('1234567890123456789012345678901234567890123456789012345678901234'));

describe('TOTP', () => {
  describe('RFC 6238 test vectors', () => {
    // Time, Expected TOTP (SHA1), Expected TOTP (SHA256), Expected TOTP (SHA512)
    const vectors: [number, string, string, string][] = [
      [59000, '94287082', '46119246', '90693936'],
      [1111111109000, '07081804', '68084774', '25091201'],
      [1111111111000, '14050471', '67062674', '99943326'],
      [1234567890000, '89005924', '91819424', '93441116'],
      [2000000000000, '69279037', '90698825', '38618901'],
      [20000000000000, '65353130', '77737706', '47863826'],
    ];

    for (const [timeMs, expectedSha1, expectedSha256, expectedSha512] of vectors) {
      it(`should generate correct SHA1 code at time ${timeMs / 1000}`, () => {
        const totp = TOTP.create({
          algorithm: Algorithm.SHA1,
          digits: 8,
          period: 30,
          allowedDrift: 0,
          clock: () => timeMs,
        });
        expect(totp.generate(RFC_SECRET_SHA1)).toBe(expectedSha1);
      });

      it(`should generate correct SHA256 code at time ${timeMs / 1000}`, () => {
        const totp = TOTP.create({
          algorithm: Algorithm.SHA256,
          digits: 8,
          period: 30,
          allowedDrift: 0,
          clock: () => timeMs,
        });
        expect(totp.generate(RFC_SECRET_SHA256)).toBe(expectedSha256);
      });

      it(`should generate correct SHA512 code at time ${timeMs / 1000}`, () => {
        const totp = TOTP.create({
          algorithm: Algorithm.SHA512,
          digits: 8,
          period: 30,
          allowedDrift: 0,
          clock: () => timeMs,
        });
        expect(totp.generate(RFC_SECRET_SHA512)).toBe(expectedSha512);
      });
    }
  });

  describe('generate', () => {
    it('should generate a 6-digit code by default', () => {
      const totp = TOTP.defaultInstance();
      const secret = generateSecret();
      const code = totp.generate(secret);
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate an 8-digit code with high security config', () => {
      const totp = TOTP.create({ ...highSecurityConfig() });
      const secret = generateSecret(Algorithm.SHA512);
      const code = totp.generate(secret);
      expect(code).toMatch(/^\d{8}$/);
    });

    it('should generate consistent codes for the same time', () => {
      const fixedTime = 1000000000000;
      const totp = TOTP.create({ clock: () => fixedTime });
      const secret = generateSecret();
      expect(totp.generate(secret)).toBe(totp.generate(secret));
    });
  });

  describe('verify', () => {
    it('should verify a correct code', () => {
      const fixedTime = 1000000000000;
      const totp = TOTP.create({ clock: () => fixedTime });
      const secret = generateSecret();
      const code = totp.generate(secret);
      expect(totp.verify(secret, code)).toBe(true);
    });

    it('should reject an incorrect code', () => {
      const totp = TOTP.defaultInstance();
      const secret = generateSecret();
      expect(totp.verify(secret, '000000')).toBe(false);
    });

    it('should accept codes within drift window', () => {
      const fixedTime = 1000000000000;
      const totp = TOTP.create({
        allowedDrift: 1,
        clock: () => fixedTime,
      });
      const secret = generateSecret();

      // Generate code for one period ahead
      const futureTotp = TOTP.create({
        allowedDrift: 0,
        clock: () => fixedTime + 30000,
      });
      const futureCode = futureTotp.generate(secret);
      expect(totp.verify(secret, futureCode)).toBe(true);
    });

    it('should reject codes outside drift window', () => {
      const fixedTime = 1000000000000;
      const totp = TOTP.create({
        allowedDrift: 0,
        clock: () => fixedTime,
      });
      const secret = generateSecret();

      const farFuture = TOTP.create({
        allowedDrift: 0,
        clock: () => fixedTime + 60000,
      });
      const farCode = farFuture.generate(secret);
      expect(totp.verify(secret, farCode)).toBe(false);
    });
  });

  describe('verifyWithDetails', () => {
    it('should return details for valid code', () => {
      const fixedTime = 1000000000000;
      const totp = TOTP.create({ clock: () => fixedTime });
      const secret = generateSecret();
      const code = totp.generate(secret);
      const result = totp.verifyWithDetails(secret, code);
      expect(result.valid).toBe(true);
      expect(result.timeOffset).toBe(0);
      expect(result.message).toBe('Valid');
    });

    it('should return details for invalid code', () => {
      const totp = TOTP.defaultInstance();
      const secret = generateSecret();
      const result = totp.verifyWithDetails(secret, '000000');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid code');
    });
  });

  describe('replay protection', () => {
    it('should block reused codes', () => {
      const fixedTime = 1000000000000;
      const guard = InMemoryReplayGuard.withDefaultRetention();
      const totp = TOTP.create({
        clock: () => fixedTime,
        replayGuard: guard,
      });
      const secret = generateSecret();
      const code = totp.generate(secret);

      expect(totp.verify(secret, code, 'user1')).toBe(true);
      expect(totp.verify(secret, code, 'user1')).toBe(false); // replay!

      guard.destroy();
    });

    it('should allow same code for different users', () => {
      const fixedTime = 1000000000000;
      const guard = InMemoryReplayGuard.withDefaultRetention();
      const totp = TOTP.create({
        clock: () => fixedTime,
        replayGuard: guard,
      });
      const secret = generateSecret();
      const code = totp.generate(secret);

      expect(totp.verify(secret, code, 'user1')).toBe(true);
      expect(totp.verify(secret, code, 'user2')).toBe(true);

      guard.destroy();
    });
  });

  describe('getCurrentCounter', () => {
    it('should calculate correct counter', () => {
      const totp = TOTP.create({ clock: () => 60000 }); // 60 seconds
      expect(totp.getCurrentCounter()).toBe(2); // 60 / 30 = 2
    });
  });

  describe('getSecondsRemaining', () => {
    it('should return seconds until next period', () => {
      const totp = TOTP.create({ clock: () => 45000 }); // 45 seconds
      expect(totp.getSecondsRemaining()).toBe(15); // 30 - (45 % 30) = 15
    });
  });

  describe('generateAt', () => {
    it('should generate code at specific timestamp', () => {
      const totp = TOTP.create({ ...defaultConfig() });
      const secret = generateSecret();
      const timestamp = 1000000000000;

      const code = totp.generateAt(secret, timestamp);
      expect(code).toMatch(/^\d{6}$/);

      // Same timestamp should produce same code
      expect(totp.generateAt(secret, timestamp)).toBe(code);
    });
  });

  describe('config presets', () => {
    it('should create with sha256 config', () => {
      const totp = TOTP.create({ ...sha256Config() });
      expect(totp.config.algorithm).toBe(Algorithm.SHA256);
    });

    it('should create with high security config', () => {
      const totp = TOTP.create({ ...highSecurityConfig() });
      expect(totp.config.algorithm).toBe(Algorithm.SHA512);
      expect(totp.config.digits).toBe(8);
    });
  });

  describe('validation', () => {
    it('should reject short secrets', () => {
      const totp = TOTP.defaultInstance();
      expect(() => totp.generate('ABC')).toThrow();
    });

    it('should reject non-numeric codes', () => {
      const totp = TOTP.defaultInstance();
      const secret = generateSecret();
      expect(totp.verify(secret, 'abcdef')).toBe(false);
    });

    it('should reject wrong-length codes', () => {
      const totp = TOTP.defaultInstance();
      const secret = generateSecret();
      expect(totp.verify(secret, '12345')).toBe(false);
      expect(totp.verify(secret, '1234567')).toBe(false);
    });
  });
});
