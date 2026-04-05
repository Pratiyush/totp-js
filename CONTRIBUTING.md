# Contributing to totp-js

Thanks for your interest in contributing!

## Development Setup

```bash
git clone https://github.com/Pratiyush/totp-js.git
cd totp-js
npm install
npm test
```

## How to Contribute

1. Fork this repository
2. Create a branch: `git checkout -b feat/your-feature` or `fix/your-fix`
3. Make your changes
4. Run checks: `npm run typecheck && npm run lint && npm test`
5. Submit a PR with ONE change per PR

## Coding Standards

- **TypeScript strict mode** — all code must pass `tsc --noEmit`
- **No runtime dependencies** — core TOTP must have zero deps
- **Constant-time operations** — use `crypto.timingSafeEqual()` for comparisons
- **Immutable configs** — configuration objects should be readonly
- **Tests required** — every new feature or fix needs tests
- **80%+ coverage** — coverage must not drop below thresholds

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

<body>

<footer>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

## PR Guidelines

- **One change per PR** — keeps reviews fast
- Tests pass (`npm test`)
- Types check (`npm run typecheck`)
- No new runtime dependencies without discussion
- Security-sensitive changes require extra review

## Security

If you discover a security vulnerability, **do NOT** open a public issue. See [SECURITY.md](SECURITY.md).

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
