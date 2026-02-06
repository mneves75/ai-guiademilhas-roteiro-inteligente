# Test Plan (v1 Requirements Closure)

## Local Gates

- `pnpm lint`
- `pnpm type-check`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`

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
