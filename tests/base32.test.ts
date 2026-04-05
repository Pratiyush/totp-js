import { describe, it, expect } from 'vitest';
import { encode, decode, isValid } from '../src/internal/base32.js';

describe('Base32', () => {
  describe('encode', () => {
    it('should encode empty input', () => {
      expect(encode(new Uint8Array(0))).toBe('');
    });

    it('should encode RFC 4648 test vectors', () => {
      const vectors: [string, string][] = [
        ['f', 'MY'],
        ['fo', 'MZXQ'],
        ['foo', 'MZXW6'],
        ['foob', 'MZXW6YQ'],
        ['fooba', 'MZXW6YTB'],
        ['foobar', 'MZXW6YTBOI'],
      ];

      for (const [input, expected] of vectors) {
        const bytes = new TextEncoder().encode(input);
        expect(encode(bytes)).toBe(expected);
      }
    });

    it('should encode with padding when requested', () => {
      const bytes = new TextEncoder().encode('f');
      expect(encode(bytes, true)).toBe('MY======');
    });
  });

  describe('decode', () => {
    it('should decode empty input', () => {
      expect(decode('')).toEqual(new Uint8Array(0));
    });

    it('should decode RFC 4648 test vectors', () => {
      const vectors: [string, string][] = [
        ['MY', 'f'],
        ['MZXQ', 'fo'],
        ['MZXW6', 'foo'],
        ['MZXW6YQ', 'foob'],
        ['MZXW6YTB', 'fooba'],
        ['MZXW6YTBOI', 'foobar'],
      ];

      for (const [input, expected] of vectors) {
        const result = new TextDecoder().decode(decode(input));
        expect(result).toBe(expected);
      }
    });

    it('should be case-insensitive', () => {
      const upper = decode('MZXW6YTBOI');
      const lower = decode('mzxw6ytboi');
      expect(upper).toEqual(lower);
    });

    it('should handle padding', () => {
      const withPad = decode('MY======');
      const withoutPad = decode('MY');
      expect(withPad).toEqual(withoutPad);
    });

    it('should throw on invalid characters', () => {
      expect(() => decode('invalid!@#')).toThrow('Invalid Base32 character');
    });
  });

  describe('roundtrip', () => {
    it('should roundtrip random data', () => {
      const data = new Uint8Array([0, 1, 2, 128, 255, 42, 100, 200, 150, 75]);
      const encoded = encode(data);
      const decoded = decode(encoded);
      expect(decoded).toEqual(data);
    });

    it('should roundtrip 20-byte TOTP secret', () => {
      const secret = new Uint8Array(20);
      for (let i = 0; i < 20; i++) secret[i] = i * 13 + 7;
      const encoded = encode(secret);
      const decoded = decode(encoded);
      expect(decoded).toEqual(secret);
    });
  });

  describe('isValid', () => {
    it('should accept valid Base32', () => {
      expect(isValid('JBSWY3DPEHPK3PXP')).toBe(true);
      expect(isValid('MZXW6YTBOI')).toBe(true);
    });

    it('should reject empty string', () => {
      expect(isValid('')).toBe(false);
    });

    it('should reject invalid characters', () => {
      expect(isValid('invalid!@#')).toBe(false);
      expect(isValid('0189')).toBe(false); // 0, 1, 8, 9 not in base32
    });

    it('should accept lowercase', () => {
      expect(isValid('jbswy3dpehpk3pxp')).toBe(true);
    });
  });
});
