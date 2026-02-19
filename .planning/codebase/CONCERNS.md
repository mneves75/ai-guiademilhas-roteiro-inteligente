# CONCERNS.md — Technical Debt, Issues & Risks

> Auto-generated codebase map. Known issues, tech debt, and areas of concern.

## Technical Debt

### TD-1: Legacy Better Auth References in Schema

**Severity**: Low
**Location**: `src/db/schema/postgres.ts`

The schema comments still reference "Better Auth" (lines 32, 54, 67, etc.) even though auth was migrated to Supabase Auth. The tables (`users`, `sessions`, `accounts`) are retained for app-level queries but comments are misleading.

**Impact**: Confusion for new developers reading schema.
**Fix**: Update comments to reflect Supabase Auth reality.

### TD-2: Legacy .env.example Auth Section

**Severity**: Low
**Location**: `.env.example` (lines 40-47)

The `.env.example` still references Better Auth configuration (`BETTER_AUTH_SECRET`, `BETTER_AUTH_BASE_URL`, `BETTER_AUTH_URL`). These are no longer used since Supabase Auth migration.

**Impact**: Confusion during setup. New devs may set unused vars.
**Fix**: Replace Better Auth section with Supabase Auth env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### TD-3: Dual DB Client Type Casting

**Severity**: Medium
**Location**: `src/db/client.ts`

The multi-dialect support uses `as unknown as CanonicalDb` type casts to maintain a unified API surface. This is a deliberate trade-off documented in the code, but PG-specific SQL features may compile successfully and fail at runtime when `DB_PROVIDER != postgres`.

**Impact**: Silent runtime failures if PG-specific queries are used with SQLite/D1.
**Fix**: Maintain discipline: keep queries Drizzle-portable. Consider runtime query validation.

### TD-4: Uncommitted Files in Working Tree

**Severity**: Medium
**Location**: Git working tree

Multiple files are modified or untracked:
- Modified: `.env.example`, `AGENTS.md`, `CLAUDE.md`, auth files, planner files, proxy, DB client, tests
- Untracked: `.cachebro/`, `.env.local.bak`, `.omc/`, `app/api/e2e/`, `memory/`, scripts, `supabase/`, normalize-report files

**Impact**: Risk of losing work, unclear what's production-ready vs in-progress.
**Fix**: Commit or stash in-progress work. Clean up `.env.local.bak` and temp dirs.

## Security Concerns

### SEC-1: E2E Auth Bypass in Production Risk

**Severity**: High (if misconfigured)
**Location**: `src/lib/auth.ts` (line 18), `proxy.ts`

The E2E auth bypass (`PLAYWRIGHT_E2E=1` + `e2e_auth` cookie) creates a fake admin-like session. This is gated by the `PLAYWRIGHT_E2E` env var, but if accidentally set in production, any request with the `e2e_auth=1` cookie would bypass authentication entirely.

**Mitigation**: Ensure `PLAYWRIGHT_E2E` is never set in production deployments. Consider adding explicit `NODE_ENV !== 'production'` guard.

### SEC-2: Rate Limiting Without Persistent Store

**Severity**: Medium
**Location**: `src/lib/security/rate-limit.ts`

In-memory rate limiting doesn't persist across serverless invocations or multiple instances. Upstash Redis is optional but recommended.

**Impact**: Rate limits may not work effectively in serverless/multi-instance deployments.
**Fix**: Enable Upstash Redis in production (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).

### SEC-3: Admin Access via Env Var

**Severity**: Low
**Location**: `src/lib/auth.ts`, `ADMIN_EMAILS` env var

Admin access is controlled by a comma-separated email list in environment variables. This is simple but means admin changes require a redeploy.

**Impact**: No audit trail for admin grants/revokes, no runtime admin management.
**Fix**: Acceptable for current scale. Move to DB-based roles when team grows.

## Performance Concerns

### PERF-1: No Database Connection Pooling Config

**Severity**: Low
**Location**: `src/db/adapters/postgres.ts`

Using Supabase's built-in connection pooler (hence `prepare: false`), but there's no explicit pool size configuration or connection timeout settings in the app layer.

**Impact**: May hit connection limits under load.
**Fix**: Supabase pooler handles this, but monitor connection usage.

### PERF-2: Plan Cache TTL — Query-Time Enforcement

**Severity**: Low
**Location**: `src/lib/planner/cache.ts`

Cache TTL (7 days) is enforced at query time, not via a cron job or database trigger. Stale cache entries accumulate until queried.

**Impact**: Slow cache table growth over time.
**Fix**: Acceptable for current scale. Add periodic cleanup if table grows beyond ~10k rows.

### PERF-3: PDF Generation Server-Side

**Severity**: Low
**Location**: `app/api/planner/plans/[id]/pdf/route.ts`

PDF generation via `@react-pdf/renderer` runs server-side on every request. No caching of generated PDFs.

**Impact**: CPU-intensive under load if many users download PDFs simultaneously.
**Fix**: Cache generated PDFs in storage or add a cache header.

## Fragile Areas

### FRAG-1: proxy.ts Complexity

**Severity**: Medium
**Location**: `proxy.ts`

The proxy handles multiple concerns: session refresh, CSRF, rate limiting, CSP, locale routing, E2E auth. This is the single entry point for all requests and any bug here affects the entire application.

**Impact**: High blast radius for proxy bugs.
**Fix**: Thorough E2E tests for proxy behavior. Consider splitting concerns into composable middleware functions.

### FRAG-2: Zod Schema with superRefine + strict

**Severity**: Low
**Location**: `src/lib/planner/schema.ts`

The `travelPreferencesSchema` uses `.superRefine().strict()` which makes `.pick()` and `.partial()` fail. Must use `.innerType()` first.

**Impact**: Confusing DX; easy to introduce runtime errors when modifying schemas.
**Fix**: Document the pattern (already in CLAUDE.md gotchas). Consider restructuring to avoid the need for `.innerType()`.

### FRAG-3: Multi-Dialect Schema Parity

**Severity**: Medium
**Location**: `src/db/schema/postgres.ts`, `src/db/schema/sqlite.ts`

Two separate schema files must stay in sync. There's a `schema-parity` check (`pnpm db:schema-parity`) but drift can occur between commits.

**Impact**: SQLite/D1 deployments may break if schema diverges.
**Fix**: Parity check in CI (`pnpm verify:ci` includes it). Consider generating SQLite schema from PG schema.

## Missing / Incomplete

### MISS-1: No Automated Backup Strategy

No automated database backup strategy documented or implemented beyond Supabase's built-in backups.

### MISS-2: No Error Boundary Components

No React error boundaries visible in the component tree. Unhandled client-side errors may show white screens.

### MISS-3: No Structured Logging in Planner Stream

The SSE streaming endpoint (`/api/planner/generate-stream`) may not have structured logging for stream lifecycle events (start, chunk count, completion, abort).

### MISS-4: No Load Testing

No load testing scripts or configuration. The planner's AI-dependent streaming could be a bottleneck.

## Recommendations (Priority Order)

1. **SEC-1**: Add `NODE_ENV !== 'production'` guard to E2E auth bypass
2. **TD-4**: Commit or stash uncommitted work
3. **TD-1/TD-2**: Clean up Better Auth references in schema and .env.example
4. **SEC-2**: Enable Upstash Redis for production rate limiting
5. **MISS-2**: Add React error boundaries at layout level
6. **PERF-3**: Cache generated PDFs
7. **FRAG-1**: Add more E2E coverage for proxy behavior
