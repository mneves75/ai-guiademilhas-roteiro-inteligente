# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Planner API contract helpers with resilient parsing for versioned success payloads and RFC 9457 problem details
- Route-level unit tests for `POST /api/planner/generate` (401, 429 problem+json, 200 success)
- OpenAPI 3.1 contract for planner endpoint (`docs/openapi.planner.yaml`)
- First-principles 10/10 framework reuse review doc (`docs/reuso-framework-10-10-carmack.pt-br.md`)
- Framework upstream automation commands:
  - `pnpm framework:bootstrap`
  - `pnpm framework:status`
  - `pnpm framework:preview`
  - `pnpm framework:check`
  - `pnpm framework:doctor`
  - `pnpm framework:sync`
  - `pnpm framework:sync:verify`
- CI workflow for upstream drift governance (`.github/workflows/upstream-drift.yml`)
- CI workflow for weekly upstream sync PR automation (`.github/workflows/upstream-sync-pr.yml`)
- CODEOWNERS baseline for ownership boundaries (`.github/CODEOWNERS`)

### Changed

- `POST /api/planner/generate` now returns versioned success payload (`schemaVersion`, `generatedAt`) and standardized 429 `application/problem+json`
- Planner UI now parses both v2 and legacy payloads, and surfaces retry hints from rate-limit errors
- Reuse docs now document executable upstream sync workflow with branch autodetection and local path defaults
- Upstream automation now supports local path and remote Git URL sources via `FRAMEWORK_UPSTREAM_SOURCE`
- Bootstrap now enables Git `rerere` to reduce recurring merge-conflict cost
- Weekly upstream sync PR workflow now runs baseline quality checks (`pnpm lint && pnpm test`) before opening/updating PR
- Repository now stores a local merge bridge to upstream history, enabling incremental `framework:sync` without unrelated-history errors
- Framework upstream automation now includes `doctor` governance diagnostics (origin, CODEOWNERS, branch protection checks via `gh` when available)

### Fixed

- `security:audit` now handles Git repos without commits by falling back to directory-based gitleaks scan
- `framework:status` now parses ahead/behind counters correctly when Git returns tab-separated values

## [0.4.4] - 2026-02-10

### Changed

- Release bookkeeping (version bump + docs)

## [0.4.3] - 2026-02-10

### Changed

- Public locale redirects now default to `/en` unless the user explicitly chose a locale (cookie), avoiding Accept-Language based redirects

## [0.4.2] - 2026-02-10

### Added

- Stronger SEO E2E coverage: asserts locale-stable `rel=canonical` and `hreflang` alternates on the home page

## [0.4.1] - 2026-02-10

### Fixed

- `hreflang` alternates no longer point to non-existent translations (posts and tag pages now advertise alternates only when the target locale exists)
- Added unit coverage for alternates generation to prevent regressions

## [0.4.0] - 2026-02-10

### Added

- RSS feed for the blog at `/rss.xml`
- Optional site verification env vars for SEO (`GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`)
- Noindex metadata for sensitive routes (dashboard and invite flows)
- New unit coverage for SEO routes (sitemap, robots, RSS)
- Server Action to switch locale by setting an `httpOnly` locale cookie (no client `document.cookie` writes)
- Locale-prefixed public URLs for SEO-stable i18n (`/en/*`, `/pt-br/*`) with `hreflang` alternates and canonical URLs
- `publicAlternates()` helper to generate canonical + language alternates consistently across public pages
- New pt-BR technical blog posts to establish topical authority (auth, SEO, E2E, Stripe, multi-tenancy)
- Wide Playwright smoke that exercises key public + protected screens in pt-BR (chromium-only)

### Changed

- `sitemap.xml` now includes only indexable public pages plus blog posts and tag pages (and excludes auth pages), with entries emitted per locale
- `robots.txt` is now minimal (only disallows `/api/`); sensitive surfaces are controlled via `noindex` metadata + `X-Robots-Tag`
- Locale resolution is memoized per request and propagated without client-side locale state (refresh-driven consistency)
- `PW_FULL=1 pnpm test:e2e` now builds/starts outside Playwright's `webServer` to reduce peak memory and avoid `exit 137`

### Fixed

- Completed pt-BR translations across the main UI surfaces (marketing, blog, dashboard, admin)
- Signup page no longer hardcodes an English conjunction (uses localized `common.and`)
- Prevented accidental pre-hydration signup GET submissions from leaking secrets in the URL (submit is disabled until hydration, and the form uses `method="post"`)
- Reduced WebKit flakiness on blog listing clicks and locale switching (pointer-events and hydration guards)

## [0.3.0] - 2026-02-10

### Added

- RFC 9116 `security.txt` (`/.well-known/security.txt`) plus a public security policy page (`/security`)
- DAST-lite Playwright checks for baseline security headers and `security.txt` validity (tagged `@dast`)
- GitHub Actions workflows for DAST-lite on schedules and on deploy (when `deployment_status.target_url` / `environment_url` is available)
- Local security audit runner (`pnpm security:audit`) that chains dependency audit, secret scan (gitleaks), DAST-lite, and basic gates
- Health and metrics endpoints for production readiness (`/health`, `/metrics`)

### Changed

- Standardized invalid `DB_PROVIDER` error messaging to English for consistency
- Refreshed the multi-DB first-principles critique to reflect current CI smokes and portability constraints
- Playwright webServer no longer overrides `NEXT_DIST_DIR` to avoid `next-env.d.ts` churn
- Centralized DB env parsing (`DB_PROVIDER`, `DATABASE_URL`, `SQLITE_PATH`) and added a cross-dialect portability check wired into CI smokes
- Added a schema parity check (`db:schema-parity`) to fail fast if Postgres and SQLite schemas drift (table names/columns)
- Removed reliance on SQL `RETURNING` in app query helpers for stronger cross-dialect compatibility (re-select after writes; unique-violation detection for idempotency)
- Fixed Postgres unique-violation detection by unwrapping Drizzle driver errors (`Error.cause`) for reliable webhook idempotency
- Added a Docker-free local Postgres smoke runner (`pnpm db:smoke:pg:local`) for deterministic verification
- Added `pnpm db:smoke` (schema parity + sqlite smoke + local pg smoke) to make multi-DB verification a single command
- Playwright E2E now provisions and seeds a deterministic DB by default (SQLite) during `webServer` startup
- Added `pnpm verify` as a single-command local verification gate (lint + type-check + unit + build + db smokes + e2e)
- Type-check is now deterministic by purging generated Next type dirs before `next typegen`
- Auth pages refactored to a server wrapper + client form pattern to avoid hydration/CSR bailout pitfalls and to improve E2E determinism
- Normalized and validated `callbackUrl` handling to prevent open redirects
- Added production fail-fast invariants for public deployments (HTTPS origin + security contact requirements)
- Standalone production start script updated to support an isolated E2E distDir without breaking runtime filesystem readers

### Fixed

- E2E flakiness on signup/login flows caused by timing and client-side state mismatches (forms now submit deterministically)
- Blog link clicks on listing pages (images no longer intercept clicks)
- Standalone/Docker runtime access to `content/blog` (content now shipped; runtime path is stable)

### Security

- Baseline security headers on public pages and API routes (with safer defaults for caching and framing)
- Strict nonce-based CSP on protected routes, plus `no-store` on authenticated pages and sensitive redirects
- Best-effort CSRF mitigations for state-changing API routes (Origin + Fetch Metadata checks) and basic rate limiting

## [0.2.0] - 2026-02-06

### Added

- Multi-database Drizzle client with `DB_PROVIDER` support: `postgres` (default), `sqlite`, `d1`
- Database tooling
  - Provider-specific drizzle-kit configs for Postgres/SQLite/D1
  - Multi-provider seed script plus a Drizzle-based seed assertion (`pnpm db:assert-seed`)
- Authentication improvements
  - Forgot/reset password pages and password reset email support
  - Magic link (passwordless) sign-in with email delivery
  - Development-only React Email preview page (`/emails/preview`)
- Admin features
  - Admin role gating for `/admin`
  - User impersonation + "stop impersonating" action in the dashboard header
  - Admin subscriptions page with estimated MRR (best-effort)
- Billing & monetization
  - Plan catalog with monthly/yearly pricing, plus a one-time payment option
  - Stripe checkout now supports monthly/yearly intervals
  - Stripe webhook idempotency via persisted event tracking (`stripe_events`)
- Minimal i18n via locale cookie + language switcher (en, pt-BR)
- Legal and marketing pages: `/pricing`, `/terms`, `/privacy`
- Avatar upload with pluggable storage adapters (local, R2, Vercel Blob) + local file serving route (`/api/files/*`)
- JSON-LD structured data for key pages (home, blog, pricing)
- Docker Compose for local Postgres + app, plus a production readiness checklist
- Playwright E2E tests and CI-friendly `webServer` configuration
- Landing page refactor: home page split into explicit components under `src/components/landing/`
- shadcn-style UI primitives for the landing page (`Accordion`, `Sheet`)
- Nightly scheduled workflow to run the full Playwright browser matrix (`PW_FULL=1`)
- Engineering sign-off and multi-DB first-principles critique docs

### Changed

- Upgraded to Next.js 16.1.6 (from 15.x)
- Upgraded @typescript-eslint packages to v8 for ESLint 9 compatibility
- Updated eslint-config-next and @next/eslint-plugin-next to v16
- Tailwind CSS v4 PostCSS setup and globals configuration
- Type-check now runs `next typegen` before `tsc` to keep typed routes consistent
- CI updated to use pnpm 10 (lockfile v9 compatibility) and reproducible installs
- Better Auth initialization is now lazy (`getAuth()`) to avoid build-time env evaluation
- Playwright now defaults to an isolated Next.js `distDir` and runs against a production build for deterministic runs

### Fixed

- Prevented build-time crashes from missing Stripe env by initializing Stripe at runtime call sites
- Prevented build-time crashes from missing Resend env by initializing the Resend client lazily at send time
- Fixed auth/env handling and reduced build-time failures by failing fast with clear messages
- Prevented `pnpm build` from failing due to auth env checks by forcing authenticated layouts to be dynamic
- Wrapped `useSearchParams()` usage behind `Suspense` to avoid CSR bailout warnings on prerender
- Middleware route allowlist updated for public blog and required anonymous APIs (webhooks, auth, OG, invites)
- Playwright E2E stability: port handling, baseURL-derived webServer port, and route path fixes (`/signup`)
- Landing header now exposes an accessible primary navigation landmark (`aria-label="Primary"`)
- Removed raw Drizzle `sql`...` usage in admin queries to keep cross-dialect portability

## [0.1.0] - 2026-02-05

### Added

- Initial project setup
- Phase 1 planning and research documentation
- Project roadmap with 12 phases covering 90 requirements
- Phase 1: Foundation & Code Quality complete
  - TypeScript strict mode enabled
  - ESLint 9 flat config with Next.js + React rules
  - Prettier formatting configuration
  - Husky pre-commit hooks with lint-staged
  - GitHub Actions CI/CD workflows (lint, type-check, test)
  - Developer documentation (DEVELOPMENT.md)
  - Environment variables template (.env.example)
- Infrastructure
  - Next.js App Router scaffold
  - pnpm as package manager
  - GitHub repository with best practices docs

[Unreleased]: https://github.com/mneves75/nextjs-bootstrapped-shipped/compare/v0.4.4...HEAD
[0.4.4]: https://github.com/mneves75/nextjs-bootstrapped-shipped/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/mneves75/nextjs-bootstrapped-shipped/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/mneves75/nextjs-bootstrapped-shipped/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/mneves75/nextjs-bootstrapped-shipped/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/mneves75/nextjs-bootstrapped-shipped/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/mneves75/nextjs-bootstrapped-shipped/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/mneves75/nextjs-bootstrapped-shipped/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mneves75/nextjs-bootstrapped-shipped/releases/tag/v0.1.0
