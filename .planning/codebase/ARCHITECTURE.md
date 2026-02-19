# ARCHITECTURE.md — System Design & Patterns

> Auto-generated codebase map. How the system is structured and data flows.

## Architecture Pattern

**Next.js App Router monolith** — Server Components first, with API routes for external integrations (Stripe webhooks, AI streaming, file serving). Multi-tenant via workspaces.

## System Layers

```
┌─────────────────────────────────────────────────┐
│  Browser (React 19 Client Components)            │
│  - shadcn/ui + Radix primitives                  │
│  - PostHog analytics, GrowthBook flags           │
│  - usePlannerStream hook (SSE consumer)          │
├─────────────────────────────────────────────────┤
│  proxy.ts (Next.js 16 Proxy Layer)               │
│  - Session refresh (Supabase)                    │
│  - CSRF protection                               │
│  - Rate limiting (auth routes)                   │
│  - CSP headers                                   │
│  - Locale routing (pt-BR/en)                     │
├─────────────────────────────────────────────────┤
│  App Router (Server Components + API Routes)     │
│  - RSC for pages (zero JS by default)            │
│  - API routes for webhooks, AI, files            │
│  - Route groups: (auth), (protected), blog, r/   │
├─────────────────────────────────────────────────┤
│  Service Layer (src/lib/)                        │
│  - auth.ts — session management                  │
│  - planner/* — AI report generation              │
│  - stripe*.ts — payment logic                    │
│  - email*.ts — transactional email               │
│  - storage/* — multi-provider file storage       │
│  - security/* — rate limit, redirect, origin     │
│  - analytics/* — funnel, PostHog                 │
├─────────────────────────────────────────────────┤
│  Data Layer (src/db/)                            │
│  - Drizzle ORM (PG canonical types)              │
│  - Multi-dialect: postgres, sqlite, d1           │
│  - Lazy singleton clients (db, dbEdge)           │
│  - Queries: src/db/queries/                      │
├─────────────────────────────────────────────────┤
│  External Services                               │
│  - Supabase (Auth + PostgreSQL)                  │
│  - Google AI (Gemini 2.5 Flash)                  │
│  - Stripe (subscriptions)                        │
│  - Resend (email)                                │
│  - PostHog, Sentry, OTEL                         │
└─────────────────────────────────────────────────┘
```

## Data Flow — AI Planner (Core Feature)

```
User fills 4-step wizard form
    │
    ▼
usePlannerStream hook (client)
    │ POST /api/planner/generate-stream
    ▼
API Route (server)
    │ 1. Auth check (requireAuth)
    │ 2. Zod validate preferences
    │ 3. Check planCache (SHA256 hash)
    │    ├─ HIT → return cached report
    │    └─ MISS → continue
    │ 4. streamPlannerReport()
    │    ├─ Build system + user prompts
    │    ├─ AI SDK streamText + Output.object()
    │    └─ SSE events: delta → delta → complete
    │ 5. Auto-save to plans table
    │ 6. Update planCache
    ▼
Client renders sections progressively
    │ ReportItem component (string | StructuredItem)
    ▼
History: /planner/history (list, view, share, delete, PDF)
```

## Data Flow — Authentication

```
Signup/Login form → Supabase Auth API
    │
    ▼
Supabase sets sb-*-auth-token cookie
    │
    ▼
proxy.ts: refreshSession() on every request
    │ Refreshes expired tokens transparently
    ▼
Server: getSession() reads Supabase cookie
    │ requireAuth() / requireAdmin() guards
    ▼
Protected routes render with user context
```

## Data Flow — Stripe Payments

```
User clicks plan → Stripe Checkout redirect
    │
    ▼
Stripe processes payment
    │
    ▼
Webhook → /api/stripe/webhook
    │ Verifies signature
    │ Updates subscriptions table
    ▼
User's plan status updated in DB
```

## Multi-Tenancy Model

```
User (1) ──── belongs to ───→ Workspace (N)
                              │
                              ├── workspaceMembers (roles: owner/admin/member)
                              ├── workspaceInvitations (token-based)
                              └── plans (workspace-scoped)
```

- Workspace context provided via `src/contexts/workspace-context.tsx`
- Plans are workspace-scoped with `workspaceId` foreign key
- Shared reports use token-based public access (no auth needed at `/r/[token]`)

## Key Abstractions

### Database Client Factory (`src/db/client.ts`)
- **Lazy Proxy pattern**: DB connections created on first property access, not import
- **Multi-dialect**: Runtime selects PG/SQLite/D1 based on `DB_PROVIDER`
- **Canonical types**: PG schema is compile-time truth; SQLite/D1 cast at runtime
- **Two clients**: `db` (Node runtime), `dbEdge` (Edge runtime)

### Planner Module (`src/lib/planner/`)
- **Prompt builder**: `prompt.ts` — locale-aware system/user prompts
- **Stream**: `stream-report.ts` — AI SDK streamText + structured output
- **Cache**: `cache.ts` — SHA256 hash → planCache table (7d TTL)
- **Schema**: `schema.ts` — Zod input/output validation
- **Types**: `types.ts` — `ReportItem = string | StructuredItem`
- **Navigation**: `navigation.ts` — planner route helpers

### Storage Abstraction (`src/lib/storage/`)
- **Factory pattern**: `index.ts` selects provider from `STORAGE_PROVIDER` env
- **Providers**: Local filesystem, Vercel Blob, Cloudflare R2
- **API**: `app/api/files/[...key]/route.ts` serves files

### Security Layer (`src/lib/security/`)
- **Rate limiting**: `rate-limit.ts` — in-memory + optional Upstash Redis
- **Safe JSON**: `safe-json.ts` — safe parsing utilities
- **Origin validation**: `origin.ts`, `local-origin.ts`
- **Redirect safety**: `redirect.ts` — prevents open redirect
- **Workspace roles**: `workspace-roles.ts` — role-based access control
- **Prod config**: `prod-config.ts` — production environment validation

## Entry Points

| Entry | File | Purpose |
|-------|------|---------|
| App root | `app/layout.tsx` | Root layout (fonts, themes, providers) |
| Home page | `app/page.tsx` | Landing page |
| Proxy | `proxy.ts` | Request interception (auth, security, locale) |
| Dev server | `pnpm dev` | Next.js dev with Turbopack |
| Production | `pnpm start` → `scripts/start-standalone.mjs` | Standalone Node server |
| Health | `/health`, `/api/health` | Liveness probes |

## Deployment

| Target | Strategy |
|--------|----------|
| Primary | Vercel (serverless + edge) |
| Alt | Docker standalone (`output: 'standalone'`) |
| DB | Supabase managed PostgreSQL |
| Assets | Vercel Blob / Cloudflare R2 |
