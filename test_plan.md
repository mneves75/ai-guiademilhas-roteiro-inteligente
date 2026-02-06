# Test Plan (v1 Requirements Closure)

## Local Gates

- `pnpm lint`
- `pnpm type-check`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`

## Database Smokes

- SQLite (no external deps)

```bash
TMPDIR="$(mktemp -d)"
export DB_PROVIDER=sqlite
export SQLITE_PATH="$TMPDIR/app.db"

pnpm db:push
pnpm db:seed
pnpm db:assert-seed
pnpm db:portability-check
```

- Postgres (local, no Docker)

```bash
pnpm db:smoke:pg:local
```

- One command (schema parity + sqlite + postgres)

```bash
pnpm db:smoke
```

## Functional Smoke (Manual)

- Auth
  - Visit `/login`, `/signup`, `/forgot-password`, `/reset-password`
  - Password reset request returns success (even for unknown email) and does not crash without email provider
  - Magic link request returns success and link verification lands on `/dashboard` when email sending is configured
- Teams
  - Create invitation from `/dashboard/team` and verify API sends email when Resend is configured
- Billing
  - `/pricing` renders from `STRIPE_PLANS`
  - `/dashboard/billing` shows subscription state and can create Checkout/Portal sessions
- Admin
  - `/admin` is role-protected
  - Impersonation can be started/stopped
- Email
  - `/emails/preview` renders templates in development only
