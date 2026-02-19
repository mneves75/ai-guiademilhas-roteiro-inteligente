# STACK.md — Technology Stack

> Auto-generated codebase map. Source of truth for tech decisions.

## Language & Runtime

| Technology | Version | Notes |
|-----------|---------|-------|
| TypeScript | 5.9.3 | `strict: true`, `noUncheckedIndexedAccess`, `noImplicitReturns` |
| Node.js | ES2020 target | Standalone output for Docker |
| React | 19.2.4 | React 19 with compiler (no manual memoization) |
| Next.js | 16.x | App Router, Turbopack, `proxy.ts` (no middleware.ts) |

## Core Frameworks

| Framework | Package | Purpose |
|-----------|---------|---------|
| Next.js 16 | `next@^16.1.6` | Full-stack framework, App Router, RSC-first |
| React 19 | `react@19.2.4` | UI layer with Server Components |
| Drizzle ORM | `drizzle-orm@^0.45.1` | Type-safe DB access, multi-dialect (PG/SQLite/D1) |
| AI SDK v6 | `ai@^6.0.79` | `streamText` + `Output.object()` for structured AI output |
| Tailwind CSS 4 | `tailwindcss@^4.1.18` | Utility-first styling |
| Zod 4 | `zod@^4.3.6` | Runtime validation, schema-first |

## UI Component Stack

| Library | Purpose |
|---------|---------|
| `shadcn/ui` | Component primitives (built on Radix) |
| `@radix-ui/*` | Accessible headless UI (accordion, dialog, dropdown, select, tabs, etc.) |
| `lucide-react` | Icon library |
| `class-variance-authority` | Variant-based component styling |
| `clsx` + `tailwind-merge` | Conditional class composition |
| `cmdk` | Command palette |
| `next-themes` | Theme (dark/light) management |
| `geist` | Font family |

## Database

| Component | Technology |
|-----------|-----------|
| Primary DB | PostgreSQL via Supabase |
| ORM | Drizzle ORM (`casing: 'snake_case'`, `prepare: false`) |
| Schema | `src/db/schema/postgres.ts` (canonical, 12+ tables) |
| Alt dialects | SQLite (`src/db/schema/sqlite.ts`), D1 |
| Clients | `db` (Node), `dbEdge` (Edge) — lazy singleton via Proxy |
| Migrations | `drizzle-kit` (push/generate/migrate) |
| Seeding | `src/db/seed.ts` (Node), `src/db/seed.d1.sql` (D1) |

## Authentication

| Component | Technology |
|-----------|-----------|
| Provider | Supabase Auth via `@supabase/ssr@^0.8.0` |
| Client lib | `@supabase/supabase-js@^2.95.3` |
| Session refresh | `proxy.ts` via `refreshSession()` |
| Cookie pattern | `sb-<project-ref>-auth-token` |
| Server helpers | `src/lib/auth.ts` — `getSession()`, `requireAuth()`, `requireAdmin()` |

## AI / LLM

| Component | Technology |
|-----------|-----------|
| Primary model | Gemini 2.5 Flash (`@ai-sdk/google@^3.0.24`) |
| Fallback | LM Studio local (`@ai-sdk/openai@^3.0.29`) |
| Streaming | AI SDK v6 `streamText` + `Output.object()` + Zod validation |
| SSE transport | `POST /api/planner/generate-stream` |

## Payments

| Component | Technology |
|-----------|-----------|
| Provider | Stripe (`stripe@^20.3.1`) |
| Client | `@stripe/stripe-js@^8.7.0` |
| Webhooks | `app/api/stripe/webhook/route.ts` |

## Email

| Component | Technology |
|-----------|-----------|
| Provider | Resend (`resend@^6.9.2`) |
| Templates | React Email (`@react-email/components`) |
| Sending | `src/lib/email-actions.ts` |

## Storage

| Provider | Package | When |
|----------|---------|------|
| Local filesystem | Built-in | Dev, VPS |
| Vercel Blob | `@vercel/blob@^2.2.0` | Vercel deploys |
| Cloudflare R2 | `@aws-sdk/client-s3@^3.987.0` | S3-compatible |

## Observability

| Tool | Package | Purpose |
|------|---------|---------|
| Pino | `pino@^10.3.1` | Structured JSON logging |
| Sentry | `@sentry/node@^10.38.0` | Error tracking |
| OpenTelemetry | `@opentelemetry/sdk-node` | Distributed tracing (OTLP/HTTP) |
| Prometheus | `prom-client@^15.1.3` | Metrics (`/metrics` endpoint) |
| PostHog | `posthog-js` + `posthog-node` | Product analytics |
| GrowthBook | `@growthbook/growthbook-react` | A/B testing / feature flags |

## Content

| Tool | Purpose |
|------|---------|
| MDX | Blog system (`@mdx-js/loader`, `next-mdx-remote`) |
| `gray-matter` | Frontmatter parsing |
| `rehype-pretty-code` + `shiki` | Syntax highlighting |
| `rehype-slug` + `remark-gfm` | Heading anchors, GFM tables |
| `reading-time` | Read time estimates |

## PDF Generation

| Component | Technology |
|-----------|-----------|
| Renderer | `@react-pdf/renderer@^4.3.2` |
| Endpoint | `app/api/planner/plans/[id]/pdf/route.ts` |
| Config | `serverExternalPackages: ['@react-pdf/renderer']` in next.config |

## Dev Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| pnpm | (system) | Package manager |
| Vitest | ^4.0.18 | Unit testing (jsdom env) |
| Playwright | ^1.58.2 | E2E testing |
| ESLint 9 | ^9.0.0 | Linting (flat config, zero warnings) |
| Prettier | ^3.1.0 | Formatting |
| Husky | ^9.1.7 | Git hooks |
| lint-staged | ^16.2.7 | Pre-commit linting |
| tsx | ^4.21.0 | TypeScript script execution |
| drizzle-kit | ^0.31.9 | DB schema management |

## Configuration Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js config (standalone output, security headers, Turbopack) |
| `tsconfig.json` | TypeScript strict config, `@/` path alias |
| `vitest.config.ts` | Vitest + jsdom + `server-only` stub |
| `proxy.ts` | Next.js 16 proxy (session refresh, CSRF, rate limit, CSP, locale) |
| `.env.example` | Full env var reference (195 lines) |
| `drizzle.config.*.ts` | Per-dialect Drizzle configs |
