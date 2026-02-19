# STRUCTURE.md — Directory Layout & Organization

> Auto-generated codebase map. Where to find things.

## Top-Level Structure

```
ai-guiademilhas-roteiro-inteligente/
├── app/                    # Next.js App Router pages & API routes
├── content/                # MDX blog posts
├── e2e/                    # Playwright E2E tests
├── public/                 # Static assets (favicon, images)
├── scripts/                # Build, deployment, utility scripts
├── src/                    # Application source code
│   ├── components/         # React components (UI + feature)
│   ├── contexts/           # React context providers
│   ├── db/                 # Database schema, clients, queries, seeds
│   ├── emails/             # React Email templates
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Shared utilities and service modules
│   └── test/               # Test setup and stubs
├── supabase/               # Supabase local dev config
├── proxy.ts                # Next.js 16 proxy (auth, CSRF, locale)
├── next.config.ts          # Next.js configuration
├── vitest.config.ts        # Unit test configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
└── .env.example            # Environment variable reference
```

## App Router (`app/`)

```
app/
├── (auth)/                 # Public auth pages
│   ├── layout.tsx          # Auth layout (centered card)
│   ├── login/              # Login page + form
│   ├── signup/             # Signup page + form
│   ├── forgot-password/    # Password reset request
│   └── reset-password/     # Password reset completion
├── (protected)/            # Authenticated pages
│   ├── admin/              # Admin-only area
│   │   ├── layout.tsx      # Admin layout + guard
│   │   ├── settings/       # App settings
│   │   ├── subscriptions/  # Subscription management
│   │   ├── users/          # User management
│   │   └── workspaces/     # Workspace management
│   ├── dashboard/          # User dashboard
│   │   ├── layout.tsx      # Dashboard layout (sidebar)
│   │   ├── analytics/      # Usage analytics
│   │   ├── billing/        # Billing/subscription
│   │   ├── notifications/  # Notifications
│   │   ├── planner/        # Planner entry from dashboard
│   │   ├── settings/       # User settings
│   │   ├── team/           # Team management
│   │   └── workspaces/     # Workspace CRUD
│   └── planner/            # AI planner (immersive zone)
│       ├── layout.tsx      # Planner layout (standalone)
│       ├── page.tsx        # 4-step wizard form
│       └── history/        # Plan history
│           ├── page.tsx    # Paginated list
│           └── [id]/       # Single plan view
├── api/                    # API routes
│   ├── auth/callback/      # OAuth callback
│   ├── e2e/auth/bootstrap/ # E2E test auth setup
│   ├── files/[...key]/     # File serving
│   ├── health/             # Health check
│   ├── invitations/accept/ # Workspace invite acceptance
│   ├── og/                 # OG image generation
│   ├── planner/            # AI planner API
│   │   ├── generate/       # Non-streaming endpoint
│   │   ├── generate-stream/# SSE streaming endpoint
│   │   ├── plans/          # Plan CRUD + PDF
│   │   └── share/          # Share token creation
│   ├── stripe/webhook/     # Stripe webhook handler
│   ├── users/              # User API
│   └── workspaces/         # Workspace API
├── blog/                   # Public blog pages
├── emails/                 # Email preview
├── health/                 # Health check page
├── invite/                 # Workspace invite pages
├── metrics/                # Prometheus metrics
├── pricing/                # Pricing page
├── privacy/                # Privacy policy
├── r/                      # Public shared reports (/r/[token])
├── security/               # Security page
├── terms/                  # Terms of service
├── globals.css             # Global styles (Tailwind)
├── layout.tsx              # Root layout
├── page.tsx                # Landing page
├── robots.ts               # robots.txt generator
├── sitemap.ts              # Sitemap generator
└── rss.xml/                # RSS feed
```

## Source Code (`src/`)

### Components (`src/components/`)

```
src/components/
├── planner/                # AI planner UI
│   ├── report-item.tsx     # Renders ReportItem (string | StructuredItem)
│   ├── pdf/                # @react-pdf/renderer templates
│   └── ...                 # Wizard steps, section renderers
├── ui/                     # shadcn/ui components (button, card, dialog, etc.)
├── dashboard/              # Dashboard-specific components
├── admin/                  # Admin panel components
├── marketing/              # Landing page components
└── shared/                 # Cross-cutting components (header, footer, etc.)
```

### Library (`src/lib/`)

```
src/lib/
├── auth.ts                 # Server auth: getSession, requireAuth, requireAdmin
├── auth-client.ts          # Client-side auth hooks
├── auth/                   # Auth utilities
│   ├── error-utils.ts      # Auth error code mapping
│   └── ui-errors.ts        # User-facing error messages
├── planner/                # AI planner module
│   ├── prompt.ts           # System/user prompt construction
│   ├── stream-report.ts    # streamText + structured output
│   ├── generate-report.ts  # Non-streaming fallback
│   ├── cache.ts            # SHA256 hash → planCache table
│   ├── schema.ts           # Zod input/output schemas
│   ├── types.ts            # ReportItem, StructuredItem, ActionLink
│   ├── constants.ts        # Planner constants
│   ├── navigation.ts       # Route helpers
│   ├── problem-response.ts # RFC 9457 error responses
│   ├── api-contract.ts     # API contract definitions
│   ├── use-planner-stream.ts # Client SSE hook
│   └── normalize-report.ts # Report normalization
├── security/               # Security utilities
│   ├── rate-limit.ts       # Rate limiting (in-memory + Redis)
│   ├── safe-json.ts        # Safe JSON parsing
│   ├── redirect.ts         # Open redirect prevention
│   ├── origin.ts           # Origin validation
│   ├── local-origin.ts     # Local origin helpers
│   ├── workspace-roles.ts  # Role-based access
│   └── prod-config.ts      # Production config validation
├── analytics/              # Analytics and tracking
│   ├── posthog-server.ts   # Server-side PostHog
│   ├── funnel.ts           # Conversion funnel tracking
│   ├── funnel-client.ts    # Client funnel helpers
│   └── funnel-slo.ts       # Funnel SLO definitions
├── storage/                # File storage abstraction
│   ├── index.ts            # Provider factory
│   ├── local.ts            # Local filesystem
│   ├── r2.ts               # Cloudflare R2
│   └── vercel-blob.ts      # Vercel Blob
├── seo/                    # SEO utilities
│   ├── structured-data.ts  # JSON-LD structured data
│   ├── public-alternates.ts# Hreflang alternates
│   └── base-url.ts         # Base URL resolution
├── supabase/               # Supabase clients
│   ├── server.ts           # Server client (cookie-based)
│   ├── client.ts           # Browser client
│   └── middleware.ts       # refreshSession() for proxy
├── telemetry/              # Observability
│   ├── sentry.ts           # Sentry initialization
│   └── node-shutdown.ts    # Graceful shutdown
├── validation/             # Input validation
│   └── email.ts            # Email validation
├── stripe.ts               # Stripe server client
├── stripe-client.ts        # Stripe browser client
├── stripe-helpers.ts       # Subscription helpers
├── email.ts                # Email client
├── email-actions.ts        # Email sending actions
├── blog.ts                 # Blog utilities
├── logger.ts               # Pino logger
├── logging.ts              # Logging helpers
├── metrics.ts              # Prometheus metrics
├── locale.ts               # Locale definitions (pt-BR, en)
├── locale-routing.ts       # Locale URL routing
├── locale-server.ts        # Server-side locale
├── locale-actions.ts       # Locale Server Actions
├── intl.ts                 # Internationalization
├── messages.ts             # UI messages
├── request-id.ts           # Request ID generation
├── http.ts                 # HTTP utilities
├── http-body.ts            # HTTP body parsing
├── utils.ts                # General utilities
├── db.ts                   # DB re-exports
├── health.ts               # Health check logic
├── admin.ts                # Admin helpers
├── plan-catalog.ts         # Plan definitions
├── plan-catalog-localized.ts # Localized plan names
└── __tests__/              # Unit tests (30 files)
```

### Database (`src/db/`)

```
src/db/
├── client.ts               # Multi-dialect client factory (db, dbEdge)
├── env.ts                  # DB provider resolution
├── schema/                 # Schema definitions
│   ├── postgres.ts         # PostgreSQL schema (canonical, 12+ tables)
│   ├── sqlite.ts           # SQLite schema (portable subset)
│   └── types.ts            # Dialect-agnostic types
├── adapters/               # Database adapter implementations
│   ├── postgres.ts         # PostgreSQL adapter
│   └── sqlite.ts           # SQLite adapter
├── queries/                # Query modules
│   ├── plans.ts            # Plan CRUD
│   └── shared-reports.ts   # Shared report queries
├── seed.ts                 # Database seeding (Node)
├── seed.d1.sql             # Database seeding (D1)
├── assert-seed.ts          # Seed assertion
├── portability-check.ts    # Dialect portability check
└── schema-parity.ts        # Schema parity check
```

## Naming Conventions

| Pattern | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `use-wizard-form.ts` |
| Components | PascalCase | `ReportItem` |
| Hooks | camelCase with `use` prefix | `useWizardForm` |
| API routes | `route.ts` in directory | `app/api/planner/generate/route.ts` |
| Tests (unit) | `*.vitest.ts` in `__tests__/` | `src/lib/__tests__/planner-schema.vitest.ts` |
| Tests (E2E) | `*.e2e.ts` in `e2e/` | `e2e/planner.e2e.ts` |
| DB schema | camelCase JS, snake_case DB | `createdAt` → `created_at` |
| Env vars | SCREAMING_SNAKE_CASE | `DATABASE_URL` |
| Route groups | `(name)` | `(auth)`, `(protected)` |

## Key Configuration Locations

| Config | File |
|--------|------|
| Next.js | `next.config.ts` |
| TypeScript | `tsconfig.json` |
| ESLint | `eslint.config.mjs` |
| Prettier | `.prettierrc` / `.prettierignore` |
| Vitest | `vitest.config.ts` |
| Playwright | `playwright.config.ts` |
| Drizzle | `drizzle.config.*.ts` (per dialect) |
| Tailwind | `app/globals.css` (v4 CSS config) |
| Git hooks | `.husky/` |
| lint-staged | `package.json` or `.lintstagedrc` |
