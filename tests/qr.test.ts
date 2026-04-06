import { describe, it, expect } from 'vitest';
import { generateQRCode, saveQRCodeToFile } from '../src/qr.js';
import { Algorithm } from '../src/algorithm.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const SECRET = 'JBSWY3DPEHPK3PXP';
const ACCOUNT = 'user@example.com';
const ISSUER = 'MyApp';

describe('generateQRCode', () => {
  it('should return a base64 data URI by default', async () => {
    const result = await generateQRCode(SECRET, ACCOUNT, ISSUER);
    expect(result.format).toBe('base64');
    expect(typeof result.data).toBe('string');
    expect(result.data as string).toMatch(/^data:image\/png;base64,/);
  });

  it('should return a PNG buffer when format is buffer', async () => {
    const result = await generateQRCode(SECRET, ACCOUNT, ISSUER, { format: 'buffer' });
    expect(result.format).toBe('buffer');
    expect(Buffer.isBuffer(result.data)).toBe(true);
    // PNG magic bytes: 89 50 4E 47
    const buf = result.data as Buffer;
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50); // P
    expect(buf[2]).toBe(0x4e); // N
    expect(buf[3]).toBe(0x47); // G
  });

  it('should return an SVG string when format is svg', async () => {
    const result = await generateQRCode(SECRET, ACCOUNT, ISSUER, { format: 'svg' });
    expect(result.format).toBe('svg');
    expect(typeof result.data).toBe('string');
    expect(result.data as string).toContain('<svg');
  });

  it('should include the correct otpauth URI', async () => {
    const result = await generateQRCode(SECRET, ACCOUNT, ISSUER);
    expect(result.uri).toMatch(/^otpauth:\/\/totp\//);
    expect(result.uri).toContain(`secret=${SECRET}`);
    expect(result.uri).toContain(`issuer=${ISSUER}`);
  });

  it('should respect custom config', async () => {
    const result = await generateQRCode(SECRET, ACCOUNT, ISSUER, {
      config: { algorithm: Algorithm.SHA256, digits: 8, period: 60, allowedDrift: 1 },
    });
    expect(result.uri).toContain('algorithm=SHA256');
    expect(result.uri).toContain('digits=8');
    expect(result.uri).toContain('period=60');
  });

  it('should throw on missing secret', async () => {
    await expect(generateQRCode('', ACCOUNT, ISSUER)).rejects.toThrow('Secret is required');
  });

  it('should throw on missing account', async () => {
    await expect(generateQRCode(SECRET, '', ISSUER)).rejects.toThrow('Account is required');
  });

  it('should throw on missing issuer', async () => {
    await expect(generateQRCode(SECRET, ACCOUNT, '')).rejects.toThrow('Issuer is required');
  });
});

describe('saveQRCodeToFile', () => {
  it('should save a PNG file and return the otpauth URI', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'totp-qr-test-'));
    const filePath = join(dir, 'qr.png');
    try {
      const uri = await saveQRCodeToFile(filePath, SECRET, ACCOUNT, ISSUER);
      expect(uri).toMatch(/^otpauth:\/\/totp\//);
      const { existsSync, readFileSync } = await import('node:fs');
      expect(existsSync(filePath)).toBe(true);
      const buf = readFileSync(filePath);
      // Check PNG magic bytes
      expect(buf[0]).toBe(0x89);
      expect(buf[1]).toBe(0x50);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
