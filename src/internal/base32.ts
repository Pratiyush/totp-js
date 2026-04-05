/**
 * RFC 4648 Base32 encoding/decoding.
 * @internal
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const PAD = '=';

const DECODE_TABLE = new Uint8Array(128);
DECODE_TABLE.fill(255);
for (let i = 0; i < ALPHABET.length; i++) {
  DECODE_TABLE[ALPHABET.charCodeAt(i)] = i;
  DECODE_TABLE[ALPHABET.toLowerCase().charCodeAt(i)] = i;
}

export function encode(data: Uint8Array, padding = false): string {
  if (data.length === 0) return '';

  let result = '';
  let buffer = 0;
  let bitsLeft = 0;

  for (const byte of data) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      result += ALPHABET[(buffer >>> bitsLeft) & 0x1f];
    }
  }

  if (bitsLeft > 0) {
    result += ALPHABET[(buffer << (5 - bitsLeft)) & 0x1f];
  }

  if (padding) {
    while (result.length % 8 !== 0) {
      result += PAD;
    }
  }

  return result;
}

export function decode(base32: string): Uint8Array {
  const cleaned = base32.replace(/=+$/, '').replace(/\s/g, '');

  if (cleaned.length === 0) return new Uint8Array(0);

  validate(cleaned);

  const output = new Uint8Array(Math.floor((cleaned.length * 5) / 8));
  let buffer = 0;
  let bitsLeft = 0;
  let index = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const val = DECODE_TABLE[cleaned.charCodeAt(i)];
    buffer = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      output[index++] = (buffer >>> bitsLeft) & 0xff;
    }
  }

  return output.subarray(0, index);
}

export function isValid(base32: string): boolean {
  const cleaned = base32.replace(/=+$/, '').replace(/\s/g, '');
  if (cleaned.length === 0) return false;

  for (let i = 0; i < cleaned.length; i++) {
    const code = cleaned.charCodeAt(i);
    if (code >= 128 || DECODE_TABLE[code] === 255) {
      return false;
    }
  }
  return true;
}

function validate(cleaned: string): void {
  for (let i = 0; i < cleaned.length; i++) {
    const code = cleaned.charCodeAt(i);
    if (code >= 128 || DECODE_TABLE[code] === 255) {
      throw new Error(`Invalid Base32 character at position ${i}: '${cleaned[i]}'`);
    }
  }
}
