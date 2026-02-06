# Production Deployment Checklist

## Environment

- Set `NEXT_PUBLIC_APP_URL` to the canonical public origin (https).
- Set a strong `BETTER_AUTH_SECRET` (32+ chars, randomly generated).
- Set `ADMIN_EMAILS` (comma-separated) and verify the intended admins can access `/admin`.

## Database

- Set `DB_PROVIDER=postgres` for production.
- Set `DATABASE_URL` to a pooled serverless-safe connection string when applicable.
- Run schema sync (Drizzle):
  - `pnpm db:push:pg`
- Seed is optional in production; do not seed real prod unless you want demo data.

## Email (Resend)

- Set `RESEND_API_KEY` and `EMAIL_FROM` (domain verified in Resend).
- Verify:
  - Welcome email sends on signup (best-effort).
  - Invitation emails send on workspace invites.
  - Password reset emails send via `/forgot-password`.

## Payments (Stripe)

- Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Set price IDs:
  - `STRIPE_PRO_MONTHLY_PRICE_ID`
  - `STRIPE_PRO_YEARLY_PRICE_ID`
  - `STRIPE_ENTERPRISE_MONTHLY_PRICE_ID`
  - `STRIPE_ENTERPRISE_YEARLY_PRICE_ID`
  - `STRIPE_ONE_TIME_PRICE_ID` (optional example product)
- Configure Stripe webhook endpoint and set `STRIPE_WEBHOOK_SECRET`.
- Verify webhook idempotency:
  - Re-sending the same event should not double-apply updates.

## CI/CD

- Ensure `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`, and `pnpm test:e2e` pass.
- If using Vercel, enable the Vercel GitHub integration for PR previews.
