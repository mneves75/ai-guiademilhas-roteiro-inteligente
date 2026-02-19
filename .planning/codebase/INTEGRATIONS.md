# INTEGRATIONS.md — External Services & APIs

> Auto-generated codebase map. All external dependencies and integration points.

## Database — Supabase PostgreSQL

| Aspect | Detail |
|--------|--------|
| Provider | Supabase (hosted PostgreSQL) |
| Driver | `postgres` (postgres.js) — same driver for Node + Edge |
| ORM | Drizzle ORM with `prepare: false` (required for Supabase connection pooler) |
| Schema | `src/db/schema/postgres.ts` — 12+ tables with soft deletes |
| Alt providers | SQLite (local dev), Cloudflare D1 (Workers) |
| Connection | `DATABASE_URL` env var, connection pooler endpoint |
| Key files | `src/db/client.ts`, `src/db/adapters/postgres.ts`, `src/db/env.ts` |

## Authentication — Supabase Auth

| Aspect | Detail |
|--------|--------|
| Provider | Supabase Auth via `@supabase/ssr` |
| Methods | Email/password + OAuth (Google, GitHub) |
| Session | Cookie-based (`sb-*-auth-token`), refreshed in `proxy.ts` |
| Server client | `src/lib/supabase/server.ts` |
| Browser client | `src/lib/supabase/client.ts` |
| Middleware | `src/lib/supabase/middleware.ts` — `refreshSession()` |
| Auth helpers | `src/lib/auth.ts` — `getSession()`, `requireAuth()`, `requireAdmin()` |
| OAuth callback | `app/api/auth/callback/route.ts` |
| Admin check | `ADMIN_EMAILS` env var (comma-separated) |

## AI — Google Gemini (Primary)

| Aspect | Detail |
|--------|--------|
| Provider | Google AI Studio via `@ai-sdk/google` |
| Model | Gemini 2.5 Flash (configurable via `PLANNER_GOOGLE_MODEL`) |
| API key | `GOOGLE_GENERATIVE_AI_API_KEY` env var |
| SDK | AI SDK v6 — `streamText()` + `Output.object()` |
| Streaming | SSE via `POST /api/planner/generate-stream` |
| Non-streaming | `POST /api/planner/generate` (backward compat) |
| Key files | `src/lib/planner/stream-report.ts`, `src/lib/planner/prompt.ts` |

## AI — LM Studio (Fallback / Local Dev)

| Aspect | Detail |
|--------|--------|
| Provider | OpenAI-compatible local endpoint via `@ai-sdk/openai` |
| Base URL | `PLANNER_LM_STUDIO_BASE_URL` (default `http://localhost:1234/v1`) |
| Model | Configurable via `PLANNER_LM_STUDIO_MODEL` |
| Key files | `src/lib/planner/stream-report.ts`, `src/lib/planner/prompt.ts` |

## Payments — Stripe

| Aspect | Detail |
|--------|--------|
| Provider | Stripe subscriptions |
| Server SDK | `stripe@^20.3.1` |
| Client SDK | `@stripe/stripe-js@^8.7.0` |
| Webhooks | `app/api/stripe/webhook/route.ts` |
| Config | `src/lib/stripe.ts` — server client + plan config |
| Helpers | `src/lib/stripe-helpers.ts` — customer/subscription management |
| Plans | Pro (monthly/yearly), Enterprise (monthly/yearly), One-time |
| Env vars | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, price IDs |

## Email — Resend

| Aspect | Detail |
|--------|--------|
| Provider | Resend |
| SDK | `resend@^6.9.2` |
| Templates | React Email (`src/emails/`) |
| Sending | `src/lib/email-actions.ts` |
| Config | `src/lib/email.ts` |
| Env vars | `RESEND_API_KEY`, `EMAIL_FROM` |

## File Storage — Multi-Provider

| Provider | Package | Env Config |
|----------|---------|------------|
| Local | Built-in | `STORAGE_PROVIDER=local`, `STORAGE_LOCAL_PATH` |
| Vercel Blob | `@vercel/blob` | `BLOB_READ_WRITE_TOKEN` |
| Cloudflare R2 | `@aws-sdk/client-s3` | `R2_*` env vars |
| Key files | `src/lib/storage/index.ts`, `src/lib/storage/local.ts`, `src/lib/storage/r2.ts`, `src/lib/storage/vercel-blob.ts` |
| API | `app/api/files/[...key]/route.ts` |

## Analytics — PostHog

| Aspect | Detail |
|--------|--------|
| Client SDK | `posthog-js@^1.345.3` |
| Server SDK | `posthog-node@^5.24.15` |
| Config | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |
| Server helper | `src/lib/analytics/posthog-server.ts` |
| Funnel tracking | `src/lib/analytics/funnel.ts`, `src/lib/analytics/funnel-client.ts` |
| SLO | `src/lib/analytics/funnel-slo.ts` |

## A/B Testing — GrowthBook

| Aspect | Detail |
|--------|--------|
| SDK | `@growthbook/growthbook-react@^1.6.4` |
| Config | `NEXT_PUBLIC_GROWTHBOOK_API_HOST`, `NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY` |

## Error Tracking — Sentry

| Aspect | Detail |
|--------|--------|
| SDK | `@sentry/node@^10.38.0` |
| Config | `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE` |
| Init | `src/lib/telemetry/sentry.ts` |

## Tracing — OpenTelemetry

| Aspect | Detail |
|--------|--------|
| SDK | `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node` |
| Exporter | `@opentelemetry/exporter-trace-otlp-http` |
| Config | `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME` |

## Metrics — Prometheus

| Aspect | Detail |
|--------|--------|
| SDK | `prom-client@^15.1.3` |
| Endpoint | `/metrics` (protected by `METRICS_TOKEN`) |
| Key file | `src/lib/metrics.ts` |

## Rate Limiting — Upstash Redis (Optional)

| Aspect | Detail |
|--------|--------|
| Purpose | Edge rate limiting for auth POST routes |
| Config | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Key file | `src/lib/security/rate-limit.ts` |

## Image Optimization

| Source | Config |
|--------|--------|
| Google avatars | `lh3.googleusercontent.com` |
| GitHub avatars | `avatars.githubusercontent.com` |
| Vercel Blob | `*.public.blob.vercel-storage.com` |
| Cloudflare R2 | `**.r2.cloudflarestorage.com` |
| Config | `next.config.ts` `images.remotePatterns` |

## API Routes Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/callback` | GET | OAuth callback handler |
| `/api/planner/generate-stream` | POST | SSE streaming AI report |
| `/api/planner/generate` | POST | Non-streaming AI report |
| `/api/planner/plans` | GET | List user plans (paginated) |
| `/api/planner/plans/[id]` | GET/DELETE | Single plan CRUD |
| `/api/planner/plans/[id]/pdf` | GET | PDF download |
| `/api/planner/share` | POST | Create share token |
| `/api/stripe/webhook` | POST | Stripe event handler |
| `/api/files/[...key]` | GET | File serving |
| `/api/invitations/accept` | POST | Workspace invite acceptance |
| `/api/health` | GET | Liveness probe |
| `/api/og` | GET | OG image generation |
| `/api/users` | Various | User management |
| `/api/workspaces` | Various | Workspace management |
| `/api/e2e/auth/bootstrap` | POST | E2E test auth setup |
| `/health` | GET | Liveness probe (page) |
| `/metrics` | GET | Prometheus metrics |
