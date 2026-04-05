/**
 * HMAC computation using Node.js crypto module.
 * Uses createHmac for synchronous, reliable HMAC generation.
 * @internal
 */

import { createHmac } from 'node:crypto';

const ALGORITHM_MAP: Record<string, string> = {
  'HmacSHA1': 'sha1',
  'HmacSHA256': 'sha256',
  'HmacSHA512': 'sha512',
};

export function computeHmac(
  algorithm: string,
  key: Uint8Array,
  data: Uint8Array,
): Uint8Array {
  const nodeAlgo = ALGORITHM_MAP[algorithm];
  if (!nodeAlgo) {
    throw new Error(`Unsupported HMAC algorithm: ${algorithm}`);
  }

  const hmac = createHmac(nodeAlgo, key);
  hmac.update(data);
  return new Uint8Array(hmac.digest());
}

export function isAlgorithmAvailable(algorithm: string): boolean {
  return algorithm in ALGORITHM_MAP;
}
