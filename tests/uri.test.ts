import { describe, it, expect } from 'vitest';
import { buildOtpauthUri } from '../src/uri.js';
import { Algorithm } from '../src/algorithm.js';

describe('buildOtpauthUri', () => {
  it('should build a valid otpauth URI with defaults', () => {
    const uri = buildOtpauthUri('JBSWY3DPEHPK3PXP', 'user@example.com', 'MyApp');
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
    expect(uri).toContain('issuer=MyApp');
    expect(uri).toContain('algorithm=SHA1');
    expect(uri).toContain('digits=6');
    expect(uri).toContain('period=30');
  });

  it('should build URI with custom config', () => {
    const uri = buildOtpauthUri('JBSWY3DPEHPK3PXP', 'user@example.com', 'MyApp', {
      algorithm: Algorithm.SHA256,
      digits: 8,
      period: 60,
      allowedDrift: 1,
    });
    expect(uri).toContain('algorithm=SHA256');
    expect(uri).toContain('digits=8');
    expect(uri).toContain('period=60');
  });

  it('should encode special characters in label', () => {
    const uri = buildOtpauthUri('JBSWY3DPEHPK3PXP', 'user@example.com', 'My App');
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('My%20App');
  });

  it('should throw on missing secret', () => {
    expect(() => buildOtpauthUri('', 'user@example.com', 'MyApp')).toThrow('Secret is required');
  });

  it('should throw on missing account', () => {
    expect(() => buildOtpauthUri('JBSWY3DPEHPK3PXP', '', 'MyApp')).toThrow('Account is required');
  });

  it('should throw on missing issuer', () => {
    expect(() => buildOtpauthUri('JBSWY3DPEHPK3PXP', 'user@example.com', '')).toThrow('Issuer is required');
  });
});
