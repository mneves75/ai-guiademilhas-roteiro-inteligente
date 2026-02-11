# Engineering Sign-Off

Date: 2026-02-06

This repo is in a verified green state (local gates + GitHub Actions). Further changes without new requirements would be speculative churn.

## Verified Gates

Local:

```bash
pnpm lint
pnpm type-check
pnpm test

DB_PROVIDER=sqlite SQLITE_PATH=:memory: \
  BETTER_AUTH_SECRET=devsecretdevsecretdevsecretdevsecret \
  BETTER_AUTH_URL=http://localhost:3000 \
  NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  pnpm build

CI=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 \
  DB_PROVIDER=sqlite SQLITE_PATH=:memory: \
  BETTER_AUTH_SECRET=devsecretdevsecretdevsecretdevsecret \
  BETTER_AUTH_URL=http://localhost:3000 \
  NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  pnpm test:e2e

TMPDIR="$(mktemp -d)"
DB_PROVIDER=sqlite SQLITE_PATH="$TMPDIR/app.db" pnpm db:push
DB_PROVIDER=sqlite SQLITE_PATH="$TMPDIR/app.db" pnpm db:seed
DB_PROVIDER=sqlite SQLITE_PATH="$TMPDIR/app.db" pnpm db:assert-seed
rm -rf "$TMPDIR"
```

CI (GitHub Actions):

- CI run `21739173611` passed on `master` (push on 2026-02-06).

## E2E Matrix Policy

- Default `pnpm test:e2e`: deterministic (Chromium + mobile-chrome) and does not require installing Firefox/WebKit locally.
- Full matrix (opt-in): `PW_FULL=1 pnpm test:e2e` (requires Playwright Firefox/WebKit installed).
- Nightly full matrix: `.github/workflows/nightly-e2e.yml` (scheduled + manual dispatch).

## Multi-DB Policy (Drizzle)

- Providers: `postgres` (default), `sqlite`, `d1`.
- Invariants:
  - No DB connection at import time (lazy init).
  - Invalid `DB_PROVIDER` fails immediately.
  - Missing `DATABASE_URL` fails on first DB access (not at import).
  - D1 is Worker-only (explicit binding required).
- Trade-off:
  - Postgres is the canonical compile-time type surface; dialect-specific SQL can compile and fail at runtime on SQLite/D1 if you write non-portable queries.

Details: `MULTI_DB_CRITIQUE.pt-br.md`.
