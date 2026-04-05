/**
 * Replay protection demonstration.
 * Shows how InMemoryReplayGuard prevents code reuse.
 * Run: npx tsx examples/replay-protection.ts
 */
import {
  TOTP,
  generateSecret,
  InMemoryReplayGuard,
} from '@authcraft/totp-js';

// Create a replay guard with default 2-minute retention
const guard = InMemoryReplayGuard.withDefaultRetention();
const totp = TOTP.create({ replayGuard: guard });
const secret = generateSecret();

console.log('=== Replay Protection Demo ===\n');

// Generate a code
const code = totp.generate(secret);
console.log('Generated code:', code);

// First use — should succeed
const first = totp.verifyWithDetails(secret, code, 'user-1');
console.log('First use:', first.valid ? 'VALID' : 'BLOCKED', '-', first.message);

// Second use — same user, same code — should be blocked
const second = totp.verifyWithDetails(secret, code, 'user-1');
console.log('Second use (same user):', second.valid ? 'VALID' : 'BLOCKED', '-', second.message);

// Different user — same code — should succeed (codes are per-user)
const thirdUser = totp.verifyWithDetails(secret, code, 'user-2');
console.log('Third use (different user):', thirdUser.valid ? 'VALID' : 'BLOCKED', '-', thirdUser.message);

// Guard stats
console.log('\nGuard size:', guard.size(), 'tracked codes');

// Without replay guard — no protection
const noGuardTotp = TOTP.defaultInstance();
const code2 = noGuardTotp.generate(secret);
console.log('\n=== Without Replay Guard ===');
console.log('First use:', noGuardTotp.verify(secret, code2) ? 'VALID' : 'BLOCKED');
console.log('Second use:', noGuardTotp.verify(secret, code2) ? 'VALID (no protection!)' : 'BLOCKED');

// Cleanup
guard.destroy();
console.log('\nDone.');
