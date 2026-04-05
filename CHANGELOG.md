# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-05

### Added
- Core TOTP generation and verification (RFC 6238)
- HOTP support via counter-based generation (RFC 4226)
- SHA-1, SHA-256, and SHA-512 algorithm support
- Constant-time code verification (`crypto.timingSafeEqual`)
- Built-in replay protection (`InMemoryReplayGuard`)
- Preset configurations: `defaultConfig()`, `sha256Config()`, `highSecurityConfig()`
- Cryptographically secure secret generation
- Base32 encoding/decoding (RFC 4648)
- OTPAuth URI builder for QR code integration
- Full RFC 6238 test vector validation
- 88%+ code coverage with 79 tests
