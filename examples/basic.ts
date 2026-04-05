/**
 * Basic TOTP generation and verification example.
 * Run: npx tsx examples/basic.ts
 */
import {
  TOTP,
  generateSecret,
  Algorithm,
  defaultConfig,
  sha256Config,
  highSecurityConfig,
  buildOtpauthUri,
} from '@authcraft/totp-js';

// 1. Generate a secret for the user
const secret = generateSecret();
console.log('Secret:', secret);

// 2. Create a TOTP instance with default config (SHA1, 6 digits, 30s)
const totp = TOTP.defaultInstance();

// 3. Generate a code
const code = totp.generate(secret);
console.log('Generated code:', code);

// 4. Verify the code
const isValid = totp.verify(secret, code);
console.log('Valid:', isValid);

// 5. Get detailed verification result
const result = totp.verifyWithDetails(secret, code);
console.log('Details:', result);

// 6. Check time remaining
console.log('Seconds remaining:', totp.getSecondsRemaining());

// 7. Use different algorithms
const sha256Secret = generateSecret(Algorithm.SHA256);
const sha256Totp = TOTP.create({ ...sha256Config() });
console.log('SHA256 code:', sha256Totp.generate(sha256Secret));

const sha512Secret = generateSecret(Algorithm.SHA512);
const highSecTotp = TOTP.create({ ...highSecurityConfig() });
console.log('High security (SHA512, 8-digit) code:', highSecTotp.generate(sha512Secret));

// 8. Build QR code URI for authenticator apps
const uri = buildOtpauthUri(secret, 'user@example.com', 'MyApp');
console.log('QR URI:', uri);
