import { describe, it, expect } from 'vitest';
import { defaultConfig, sha256Config, highSecurityConfig, createConfig } from '../src/config.js';
import { Algorithm } from '../src/algorithm.js';

describe('TOTPConfig', () => {
  describe('presets', () => {
    it('should have correct defaults', () => {
      const config = defaultConfig();
      expect(config.algorithm).toBe(Algorithm.SHA1);
      expect(config.digits).toBe(6);
      expect(config.period).toBe(30);
      expect(config.allowedDrift).toBe(1);
    });

    it('should have correct SHA256 config', () => {
      const config = sha256Config();
      expect(config.algorithm).toBe(Algorithm.SHA256);
      expect(config.digits).toBe(6);
    });

    it('should have correct high security config', () => {
      const config = highSecurityConfig();
      expect(config.algorithm).toBe(Algorithm.SHA512);
      expect(config.digits).toBe(8);
    });
  });

  describe('createConfig', () => {
    it('should merge with defaults', () => {
      const config = createConfig({ digits: 8 });
      expect(config.digits).toBe(8);
      expect(config.period).toBe(30); // default
    });

    it('should reject invalid period', () => {
      expect(() => createConfig({ period: 10 })).toThrow('Period must be between');
      expect(() => createConfig({ period: 200 })).toThrow('Period must be between');
    });

    it('should reject invalid digits', () => {
      expect(() => createConfig({ digits: 5 })).toThrow('Digits must be between');
      expect(() => createConfig({ digits: 9 })).toThrow('Digits must be between');
    });

    it('should reject invalid drift', () => {
      expect(() => createConfig({ allowedDrift: -1 })).toThrow('Allowed drift must be between');
      expect(() => createConfig({ allowedDrift: 10 })).toThrow('Allowed drift must be between');
    });
  });
});
