---
phase: 03-authentication-core
plan: 01
subsystem: auth
tags: [supabase, supabase-ssr, oauth, session, csrf, rate-limit, csp, proxy]

# Dependency graph
requires:
  - phase: 02-database-schema
    provides: "Drizzle ORM + PostgreSQL connection, users table, session infrastructure"
provides:
  - "Verified Supabase Auth integration (email/password + OAuth)"
  - "Verified dual-layer route protection (proxy + server layout)"
  - "Verified session persistence via cookie-based token refresh"
  - "Verified CSRF, rate limiting, CSP security layers"
affects: [03-authentication-core, 06-teams-multi-tenancy, 08-user-dashboard, 09-payments-stripe]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase SSR cookie-based auth (3 client factories: browser, server, middleware)"
    - "Dual-layer route protection: proxy cookie check + RSC layout getSession()"
    - "Open redirect prevention via normalizeCallbackUrl()"
    - "In-memory + Upstash Redis rate limiting with graceful fallback"

key-files:
  created: []
  modified: []

key-decisions:
  - "Supabase Auth (not Better Auth) is the production auth provider -- roadmap outdated"
  - "Next.js 16 proxy.ts replaces middleware.ts for session refresh, CSRF, rate limiting"
  - "Admin role check uses both ADMIN_EMAILS env allowlist and user.role metadata"
  - "E2E bypass via PLAYWRIGHT_E2E env + e2e_auth cookie -- needs production guard (SEC-1)"

patterns-established:
  - "Auth client pattern: auth-client.ts wraps supabase.auth.* methods"
  - "Session type: { user: { id, email, name, role, image } }"
  - "Protected layout pattern: getSession() + redirect(buildLoginRedirectHref(...))"
  - "Error mapping pattern: mapSignInError/mapSignUpError with Supabase error codes"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-07, AUTH-08]

# Metrics
duration: 8min
completed: 2026-02-19
---

# Phase 3 Plan 01: Auth Verification Summary

**Supabase Auth with email/password + OAuth (Google/GitHub), dual-layer route protection (proxy + RSC layouts), cookie-based session refresh, CSRF/rate-limit/CSP security layers -- all verified as pre-existing**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-19T03:00:19Z
- **Completed:** 2026-02-19T03:08:00Z
- **Tasks:** 3
- **Files modified:** 0 (verification-only plan)

## Accomplishments

- Verified AUTH-01 through AUTH-04 and AUTH-07, AUTH-08 (6 of 8 requirements) as fully implemented
- Confirmed Supabase Auth architecture with 3 client factories, dual-layer protection, and comprehensive security
- Cataloged known gaps (AUTH-05, AUTH-06, SEC-1) for subsequent plans
- `pnpm type-check` passes -- auth types are sound

## Requirement Verification Results

| Req | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AUTH-01 | Email/password signup | VERIFIED | `signUp()` in `auth-client.ts:12` calls `supabase.auth.signUp()` with `{email, password, options.data: {name, full_name}}`. `signup-form.tsx:119` calls it with client-side validation (name, email, password >= 8 chars). |
| AUTH-02 | OAuth login (Google/GitHub) | VERIFIED | `signInWithOAuth()` in `auth-client.ts:24` supports `'google'\|'github'` providers. `login-form.tsx:111-119` calls it. `app/api/auth/callback/route.ts` exchanges code via `exchangeCodeForSession()` and redirects to `/dashboard` (or `next` param). |
| AUTH-03 | Session persistence + refresh | VERIFIED | `refreshSession()` in `supabase/middleware.ts:13` creates a Supabase server client from request cookies, calls `getUser()` to trigger token refresh, returns updated cookies. `proxy.ts:218-221` calls it on every request with a session cookie. Cookie pattern: `sb-<ref>-auth-token`. |
| AUTH-04 | Logout / session clearing | VERIFIED | `signOut()` in `auth-client.ts:20` calls `supabase.auth.signOut()`. Supabase SDK handles cookie clearing. |
| AUTH-07 | Protected route redirects | VERIFIED | `proxy.ts:15` defines `PROTECTED_PAGE_PREFIXES = ['/dashboard', '/admin', '/planner']`. `proxy.ts:296-307` redirects to `/login?callbackUrl=...` when no session cookie. All 3 layouts call `getSession()` server-side and redirect if null. Admin layout additionally checks `session.user.role !== 'admin'`. |
| AUTH-08 | Middleware auth checks | VERIFIED | `proxy.ts` implements: (1) session refresh via `refreshSession()`, (2) CSRF via Fetch Metadata `sec-fetch-site` + origin validation, (3) rate limiting 30 req/10 min/IP for POST `/api/auth`, (4) CSP nonce generation for protected pages, (5) `hasSupabaseSessionCookie()` checks `sb-*-auth-token` pattern. |

## Architecture Documentation

### Auth Provider

**Supabase Auth via `@supabase/ssr`** (NOT Better Auth as the roadmap originally planned). Migration happened during Planner v3 work (2026-02-14). The implementation uses cookie-based session management with automatic token refresh.

### Three Client Factories

| Factory | File | Runtime | Usage |
|---------|------|---------|-------|
| `createSupabaseBrowserClient()` | `src/lib/supabase/client.ts` | Browser | `auth-client.ts` wraps it for `signIn`, `signUp`, `signOut`, `signInWithOAuth` |
| `createSupabaseServerClient()` | `src/lib/supabase/server.ts` | Node.js (RSC) | `auth.ts` uses it for `getSession()`, `requireAuth()`, `requireAdmin()` |
| `refreshSession()` | `src/lib/supabase/middleware.ts` | Edge (proxy) | `proxy.ts` calls it to refresh tokens on every request |

### Dual-Layer Route Protection

1. **Layer 1 (proxy.ts)**: Lightweight cookie-presence check. Redirects to `/login` if no `sb-*-auth-token` cookie exists. Fast, runs on every request.
2. **Layer 2 (RSC layouts)**: Full session validation via `getSession()` which calls `supabase.auth.getUser()`. Runs server-side in layout components. Admin layout adds role authorization.

### Security Layers in proxy.ts

| Layer | Implementation | Details |
|-------|---------------|---------|
| Session refresh | `refreshSession(request)` | Refreshes Supabase tokens, returns cookies to apply |
| CSRF | Fetch Metadata + origin check | Blocks `sec-fetch-site: cross-site`, validates origin against `NEXT_PUBLIC_APP_URL` |
| Rate limiting | `checkRateLimit()` | 30 POST requests / 10 min / IP to `/api/auth`. In-memory or Upstash Redis |
| CSP | `generateCspNonce()` + `buildProtectedCsp()` | Nonce-based CSP for protected pages, `frame-ancestors 'none'` |
| Open redirect prevention | `normalizeCallbackUrl()` | Rejects protocol-relative URLs, backslashes, absolute schemes, control characters |

### Session Type

```typescript
type Session = {
  user: {
    id: string;
    email: string;
    name: string | null;   // from user_metadata.name or full_name
    role: string | null;    // from app_metadata.role or user_metadata.role
    image: string | null;   // from user_metadata.avatar_url or picture
  };
};
```

## Key Files Reference

| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/lib/auth.ts` | Server-side session management | `getSession`, `requireAuth`, `requireAdmin`, `Session` type |
| `src/lib/auth-client.ts` | Client-side auth wrappers | `signIn`, `signUp`, `signOut`, `signInWithOAuth`, `onAuthStateChange`, `getUser` |
| `src/lib/supabase/server.ts` | Server Supabase client | `createSupabaseServerClient` |
| `src/lib/supabase/client.ts` | Browser Supabase client | `createSupabaseBrowserClient` |
| `src/lib/supabase/middleware.ts` | Session refresh for proxy | `refreshSession`, `SessionCookie` type |
| `proxy.ts` | Request interception | `proxy` function, `config` matcher |
| `app/api/auth/callback/route.ts` | OAuth callback handler | `GET` handler |
| `app/(auth)/login/login-form.tsx` | Login form | Email/password + OAuth (Google/GitHub) + magic link |
| `app/(auth)/signup/signup-form.tsx` | Signup form | Name + email + password with client validation |
| `src/lib/security/rate-limit.ts` | Rate limiting | `checkRateLimit` (memory + Upstash) |
| `src/lib/security/redirect.ts` | Open redirect prevention | `normalizeCallbackUrl`, `buildLoginRedirectHref` |
| `src/lib/auth/ui-errors.ts` | Error code mapping | `mapSignInError`, `mapSignUpError` |
| `src/lib/auth/error-utils.ts` | Error parsing utilities | `parseBodyFieldErrors`, `coerceErrorCode`, `coerceErrorMessage` |

## Task Commits

This is a verification-only plan -- no code changes were made.

1. **Task 1: Verify auth module structure and session management** - Read-only verification (AUTH-01, AUTH-02, AUTH-03, AUTH-04)
2. **Task 2: Verify protected route enforcement and proxy auth checks** - Read-only verification (AUTH-07, AUTH-08)
3. **Task 3: Write verification SUMMARY** - This document

**Plan metadata:** (pending) docs(03-01): complete auth verification plan

## Files Created/Modified

- `.planning/phases/03-authentication-core/03-01-SUMMARY.md` - This verification summary (created)

## Decisions Made

1. **Supabase Auth is the auth provider** -- The roadmap says "Better Auth" but the production codebase uses Supabase Auth via `@supabase/ssr`. This is intentional (migrated during v3 planner work, 2026-02-14). All subsequent plans should reference Supabase, not Better Auth.
2. **Next.js 16 uses proxy.ts, not middleware.ts** -- Session refresh, CSRF, rate limiting, and route protection all live in `proxy.ts`. There is no `middleware.ts`.
3. **Admin check is dual** -- Both `ADMIN_EMAILS` env var allowlist AND `user.role === 'admin'` metadata are checked (either suffices).

## Deviations from Plan

None -- plan executed exactly as written. All 6 requirements verified as pre-existing.

## Known Gaps (for Plans 02-04)

| Gap | Severity | Target Plan |
|-----|----------|-------------|
| AUTH-05 (password reset) partially implemented -- no API route | Medium | Plan 02 |
| AUTH-06 (email verification) partially implemented -- no API route | Medium | Plan 02 |
| Stale Better Auth references in multiple files | Low | Plan 03 |
| SEC-1: E2E auth bypass (`PLAYWRIGHT_E2E` + `e2e_auth` cookie) lacks production guard | High | Plan 04 |

## Issues Encountered

None -- all files exist and contain expected implementations. `pnpm type-check` passes cleanly.

## User Setup Required

None -- no external service configuration required for this verification plan.

## Next Phase Readiness

- AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-07, AUTH-08 confirmed as production-ready
- Plan 02 should implement password reset (AUTH-05) and email verification (AUTH-06) API routes
- Plan 03 should clean up stale Better Auth references
- Plan 04 should address SEC-1 (E2E bypass production guard)

## Self-Check: PASSED

All 13 referenced files verified as existing on disk. SUMMARY content matches verification evidence.

---
*Phase: 03-authentication-core*
*Completed: 2026-02-19*
