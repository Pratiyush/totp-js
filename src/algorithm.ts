/**
 * Supported HMAC algorithms for TOTP generation.
 */
export interface AlgorithmDef {
  readonly name: string;
  readonly jcaName: string;
  readonly recommendedKeyBytes: number;
  readonly otpauthName: string;
}

export const Algorithm = {
  SHA1: {
    name: 'SHA1',
    jcaName: 'HmacSHA1',
    recommendedKeyBytes: 20,
    otpauthName: 'SHA1',
  },
  SHA256: {
    name: 'SHA256',
    jcaName: 'HmacSHA256',
    recommendedKeyBytes: 32,
    otpauthName: 'SHA256',
  },
  SHA512: {
    name: 'SHA512',
    jcaName: 'HmacSHA512',
    recommendedKeyBytes: 64,
    otpauthName: 'SHA512',
  },
} as const satisfies Record<string, AlgorithmDef>;

export type AlgorithmKey = keyof typeof Algorithm;
export type AlgorithmValue = (typeof Algorithm)[AlgorithmKey];

export function algorithmFromName(name: string): AlgorithmValue {
  const upper = name.toUpperCase().replace('-', '');
  const key = upper as AlgorithmKey;
  if (key in Algorithm) {
    return Algorithm[key];
  }
  throw new Error(`Unknown algorithm: ${name}. Supported: SHA1, SHA256, SHA512`);
}

export function recommendedSecretLength(algo: AlgorithmValue): number {
  // Base32 encodes 5 bits per character
  return Math.ceil((algo.recommendedKeyBytes * 8) / 5);
}
