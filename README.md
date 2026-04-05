<div align="center">

<img src=".github/assets/logo.png" alt="totp-js logo" width="200">

# totp-js

**Security-hardened TOTP/2FA library for JavaScript and TypeScript**

[![npm version](https://img.shields.io/npm/v/totp-js?style=flat-square)](https://www.npmjs.com/package/totp-js)
[![Build](https://img.shields.io/github/actions/workflow/status/Pratiyush/totp-js/ci.yml?style=flat-square)](https://github.com/Pratiyush/totp-js/actions)
[![Coverage](https://img.shields.io/codecov/c/github/Pratiyush/totp-js?style=flat-square)](https://codecov.io/gh/Pratiyush/totp-js)
[![npm downloads](https://img.shields.io/npm/dm/totp-js?style=flat-square)](https://www.npmjs.com/package/totp-js)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

RFC 6238 (TOTP) and RFC 4226 (HOTP) compliant. Zero runtime dependencies.
Built-in replay protection. Constant-time verification. Works with Node.js 18+.

[Documentation](https://pratiyush.github.io/totp-js/) | [npm](https://www.npmjs.com/package/totp-js) | [API Reference](#api-reference)

</div>

---

## Why totp-js?

Most TOTP libraries give you the basics — generate a code, verify it. But production 2FA needs more:

- **Replay protection** — prevent the same code from being used twice
- **Constant-time verification** — prevent timing attacks that leak information
- **Secure defaults** — preset configurations so you don't need to be a cryptography expert
- **Zero dependencies** — no supply chain risk for your authentication layer

totp-js is the TypeScript counterpart to [totp-impl](https://github.com/Pratiyush/totp-impl) (Java), sharing the same security-first API design.

## Install

```bash
# npm
npm install totp-js

# yarn
yarn add totp-js

# pnpm
pnpm add totp-js
```

## Quick Start

```typescript
import { TOTP, generateSecret } from 'totp-js';

// Generate a secret for the user
const secret = generateSecret();

// Create a TOTP instance
const totp = TOTP.defaultInstance();

// Generate a code
const code = totp.generate(secret);
console.log(code); // "482915"

// Verify a code
const isValid = totp.verify(secret, code);
console.log(isValid); // true
```

## Replay Protection

Prevent the same OTP from being used twice within its validity window:

```typescript
import { TOTP, generateSecret, InMemoryReplayGuard } from 'totp-js';

const guard = InMemoryReplayGuard.withDefaultRetention();
const totp = TOTP.create({ replayGuard: guard });
const secret = generateSecret();

const code = totp.generate(secret);

// First verification — passes
totp.verify(secret, code, 'user-123'); // true

// Same code, same user — blocked!
totp.verify(secret, code, 'user-123'); // false (replay detected)

// Don't forget to clean up when done
guard.destroy();
```

## QR Code URI

Generate `otpauth://` URIs for QR code scanning with Google Authenticator, Authy, etc.:

```typescript
import { buildOtpauthUri, generateSecret } from 'totp-js';

const secret = generateSecret();
const uri = buildOtpauthUri(secret, 'user@example.com', 'MyApp');
// otpauth://totp/MyApp%3Auser%40example.com?secret=...&issuer=MyApp&algorithm=SHA1&digits=6&period=30
```

## Configuration

### Preset Configurations

```typescript
import { TOTP, defaultConfig, sha256Config, highSecurityConfig } from 'totp-js';

// Default: SHA1, 6 digits, 30s period, drift ±1
const standard = TOTP.create({ ...defaultConfig() });

// SHA-256: recommended for new deployments
const sha256 = TOTP.create({ ...sha256Config() });

// High security: SHA-512, 8 digits
const highSec = TOTP.create({ ...highSecurityConfig() });
```

### Custom Configuration

```typescript
import { TOTP, Algorithm } from 'totp-js';

const totp = TOTP.create({
  algorithm: Algorithm.SHA256,
  digits: 8,
  period: 60,        // 60-second window
  allowedDrift: 2,   // accept codes ±2 periods
});
```

### Configuration Constraints

| Parameter | Min | Max | Default |
|-----------|-----|-----|---------|
| `period` | 15s | 120s | 30s |
| `digits` | 6 | 8 | 6 |
| `allowedDrift` | 0 | 5 | 1 |

## Detailed Verification

Get more context about verification results:

```typescript
const result = totp.verifyWithDetails(secret, code);
console.log(result);
// { valid: true, timeOffset: 0, message: 'Valid' }
// { valid: false, timeOffset: 0, message: 'Invalid code' }
// { valid: false, timeOffset: 1, message: 'Code already used' }
```

## Framework Integration

### Express.js

```typescript
import express from 'express';
import { TOTP, generateSecret, InMemoryReplayGuard, buildOtpauthUri } from 'totp-js';

const app = express();
app.use(express.json());

const guard = InMemoryReplayGuard.withDefaultRetention();
const totp = TOTP.create({ replayGuard: guard });

// Setup 2FA for a user
app.post('/2fa/setup', (req, res) => {
  const secret = generateSecret();
  const uri = buildOtpauthUri(secret, req.body.email, 'MyApp');
  // Store secret in your database
  res.json({ secret, qrUri: uri });
});

// Verify 2FA code
app.post('/2fa/verify', (req, res) => {
  const { userId, code, secret } = req.body;
  const isValid = totp.verify(secret, code, userId);
  res.json({ valid: isValid });
});
```

### Next.js API Route

```typescript
// app/api/2fa/verify/route.ts
import { NextResponse } from 'next/server';
import { TOTP, InMemoryReplayGuard } from 'totp-js';

const guard = InMemoryReplayGuard.withDefaultRetention();
const totp = TOTP.create({ replayGuard: guard });

export async function POST(request: Request) {
  const { secret, code, userId } = await request.json();
  const isValid = totp.verify(secret, code, userId);
  return NextResponse.json({ valid: isValid });
}
```

### NestJS

```typescript
import { Injectable } from '@nestjs/common';
import { TOTP, generateSecret, InMemoryReplayGuard, buildOtpauthUri } from 'totp-js';

@Injectable()
export class TwoFactorService {
  private readonly totp: TOTP;
  private readonly guard: InMemoryReplayGuard;

  constructor() {
    this.guard = InMemoryReplayGuard.withDefaultRetention();
    this.totp = TOTP.create({ replayGuard: this.guard });
  }

  setup(email: string) {
    const secret = generateSecret();
    const uri = buildOtpauthUri(secret, email, 'MyApp');
    return { secret, qrUri: uri };
  }

  verify(secret: string, code: string, userId: string): boolean {
    return this.totp.verify(secret, code, userId);
  }
}
```

### Fastify

```typescript
import Fastify from 'fastify';
import { TOTP, generateSecret, InMemoryReplayGuard } from 'totp-js';

const app = Fastify();
const guard = InMemoryReplayGuard.withDefaultRetention();
const totp = TOTP.create({ replayGuard: guard });

app.post('/2fa/verify', async (request, reply) => {
  const { secret, code, userId } = request.body as any;
  const isValid = totp.verify(secret, code, userId);
  return { valid: isValid };
});
```

## Secret Generation

```typescript
import { generateSecret, generateRawSecret, isValidSecret, Algorithm } from 'totp-js';

// Default (SHA1, 20 bytes)
const secret = generateSecret();

// Algorithm-appropriate size
const sha256Secret = generateSecret(Algorithm.SHA256); // 32 bytes
const sha512Secret = generateSecret(Algorithm.SHA512); // 64 bytes

// Raw bytes for custom encoding
const rawBytes = generateRawSecret(32);

// Validate existing secrets
isValidSecret(secret); // true
isValidSecret('abc');   // false (too short)
```

## API Reference

### TOTP

| Method | Description |
|--------|-------------|
| `TOTP.create(options?)` | Create with custom options |
| `TOTP.defaultInstance()` | Create with defaults (SHA1, 6 digits, 30s) |
| `generate(secret)` | Generate code for current time |
| `generateAt(secret, timestamp)` | Generate code for specific timestamp (ms) |
| `generateForCounter(secret, counter)` | Generate code for specific counter |
| `verify(secret, code, userId?)` | Verify code (with optional replay guard) |
| `verifyWithDetails(secret, code, userId?)` | Verify with detailed result |
| `getCurrentCounter()` | Get current time counter |
| `getSecondsRemaining()` | Seconds until next code |

### Configuration

| Preset | Algorithm | Digits | Period | Drift |
|--------|-----------|--------|--------|-------|
| `defaultConfig()` | SHA-1 | 6 | 30s | ±1 |
| `sha256Config()` | SHA-256 | 6 | 30s | ±1 |
| `highSecurityConfig()` | SHA-512 | 8 | 30s | ±1 |

### Algorithm Support

| Algorithm | Key Size | Recommended For |
|-----------|----------|-----------------|
| SHA-1 | 20 bytes | Legacy compatibility (Google Authenticator default) |
| SHA-256 | 32 bytes | New deployments (recommended) |
| SHA-512 | 64 bytes | Maximum security |

## Security Features

- **Constant-time comparison** using `crypto.timingSafeEqual()` — prevents timing attacks
- **Replay protection** via `InMemoryReplayGuard` — prevents code reuse
- **Secret validation** — enforces minimum 128-bit entropy (16 bytes)
- **No sensitive data in errors** — error messages never contain secrets or codes
- **Zero runtime dependencies** — minimized attack surface

## Building from Source

```bash
git clone https://github.com/Pratiyush/totp-js.git
cd totp-js
npm install
npm run build
npm test
```

## Links

- [Documentation](https://pratiyush.github.io/totp-js/) — GitHub Pages with interactive demo
- [npm](https://www.npmjs.com/package/totp-js) — `npm install totp-js`
- [GitHub](https://github.com/Pratiyush/totp-js) — Source code, issues, PRs
- [totp-impl](https://github.com/Pratiyush/totp-impl) — Java counterpart ([Maven Central](https://central.sonatype.com/artifact/io.github.pratiyush/totp-lib))

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) — Pratiyush Kumar Singh
