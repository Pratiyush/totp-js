/**
 * Express.js 2FA middleware example.
 * Run: npx tsx examples/express-2fa.ts
 *
 * Note: This is a demonstration — in production, store secrets in a database.
 */
import {
  TOTP,
  generateSecret,
  InMemoryReplayGuard,
  buildOtpauthUri,
} from '@authcraft/totp-js';

// --- Setup ---
const guard = InMemoryReplayGuard.withDefaultRetention();
const totp = TOTP.create({ replayGuard: guard });

// Simulated user database
const users = new Map<string, { email: string; secret: string; twoFactorEnabled: boolean }>();

// --- Simulate the 2FA flow ---

// Step 1: User registers
const userId = 'user-123';
const email = 'alice@example.com';
const secret = generateSecret();
users.set(userId, { email, secret, twoFactorEnabled: false });
console.log('=== Step 1: User registered ===');
console.log('User ID:', userId);
console.log('Email:', email);

// Step 2: Enable 2FA — generate QR code URI
const qrUri = buildOtpauthUri(secret, email, 'MyApp');
console.log('\n=== Step 2: Enable 2FA ===');
console.log('Scan this QR URI with your authenticator app:');
console.log(qrUri);
console.log('Secret (manual entry):', secret);

// Step 3: User confirms 2FA by entering a code
const user = users.get(userId)!;
const confirmCode = totp.generate(user.secret);
console.log('\n=== Step 3: Confirm 2FA ===');
console.log('User enters code:', confirmCode);

const confirmResult = totp.verify(user.secret, confirmCode, userId);
if (confirmResult) {
  user.twoFactorEnabled = true;
  console.log('2FA enabled successfully!');
} else {
  console.log('Invalid code — 2FA not enabled');
}

// Step 4: User logs in with 2FA
const loginCode = totp.generate(user.secret);
console.log('\n=== Step 4: Login with 2FA ===');
console.log('User enters code:', loginCode);

const loginResult = totp.verify(user.secret, loginCode, userId);
console.log('Login result:', loginResult ? 'SUCCESS' : 'FAILED');

// Step 5: Replay protection — same code blocked
console.log('\n=== Step 5: Replay protection ===');
const replayResult = totp.verify(user.secret, loginCode, userId);
console.log('Same code again:', replayResult ? 'SUCCESS' : 'BLOCKED (replay detected)');

// Cleanup
guard.destroy();
console.log('\n=== Done ===');
