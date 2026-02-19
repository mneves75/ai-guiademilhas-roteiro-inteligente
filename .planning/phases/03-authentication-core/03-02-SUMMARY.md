---
phase: 03-authentication-core
plan: 02
subsystem: auth
tags: [supabase, password-reset, magic-link, otp, security, e2e]

# Dependency graph
requires:
  - phase: 02-database-schema
    provides: "Supabase connection + Drizzle ORM"
  - phase: 03-authentication-core/01
    provides: "Supabase Auth integration, session management, auth callback route"
provides:
  - "POST /api/auth/request-password-reset (resetPasswordForEmail)"
  - "POST /api/auth/reset-password (updateUser password)"
  - "POST /api/auth/sign-in/magic-link (signInWithOtp)"
  - "E2E bypass hardened with NODE_ENV=production guard"
affects: [03-authentication-core, 12-testing]

# Tech tracking
tech-stack:
  added: []
  patterns: ["user-enumeration-protection (always 200)", "supabase-otp-flow", "defense-in-depth NODE_ENV guards"]

key-files:
  created:
    - app/api/auth/request-password-reset/route.ts
    - app/api/auth/reset-password/route.ts
    - app/api/auth/sign-in/magic-link/route.ts
  modified:
    - src/lib/auth.ts
    - app/api/e2e/auth/bootstrap/route.ts

key-decisions:
  - "User enumeration protection: password-reset and magic-link always return 200 regardless of email existence"
  - "Reset-password relies on Supabase session from email link callback (no custom token validation needed)"
  - "SEC-1: NODE_ENV=production guard added as first check in both E2E bypass paths"

patterns-established:
  - "Anti-enumeration: auth routes that accept email always return 200 with { ok: true }"
  - "Supabase password reset: email link -> /api/auth/callback -> session -> updateUser"
  - "Defense-in-depth: NODE_ENV + PLAYWRIGHT_E2E double-guard on E2E bypass"

requirements-completed: [AUTH-05, AUTH-06]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 3 Plan 02: Auth Routes Summary

**Password reset, magic link OTP, and E2E bypass hardening via Supabase Auth APIs with user-enumeration protection**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T03:00:32Z
- **Completed:** 2026-02-19T03:02:19Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created 3 missing API routes that existing UI forms reference (previously returning 404)
- Password reset flow complete: request email -> Supabase sends link -> user clicks -> callback exchanges code -> form submits new password
- Magic link OTP sign-in via Supabase signInWithOtp with proper emailRedirectTo callback
- All email-accepting routes implement user-enumeration protection (always return 200)
- SEC-1 resolved: E2E auth bypass blocked in production via NODE_ENV guard in both auth.ts and bootstrap route

## Task Commits

Each task was committed atomically:

1. **Task 1: Create password reset API routes (AUTH-05)** - `c9bc722` (feat)
2. **Task 2: Create magic link route (AUTH-06) and harden E2E bypass (SEC-1)** - `72644e3` (feat)

## Files Created/Modified
- `app/api/auth/request-password-reset/route.ts` - POST handler calling supabase.auth.resetPasswordForEmail
- `app/api/auth/reset-password/route.ts` - POST handler calling supabase.auth.updateUser({ password })
- `app/api/auth/sign-in/magic-link/route.ts` - POST handler calling supabase.auth.signInWithOtp
- `src/lib/auth.ts` - Added NODE_ENV=production guard to getPlaywrightE2ESession()
- `app/api/e2e/auth/bootstrap/route.ts` - Added NODE_ENV=production guard before PLAYWRIGHT_E2E check

## Decisions Made
- **User enumeration protection**: Both request-password-reset and magic-link routes always return `{ ok: true }` with status 200, even if the email does not exist in Supabase. Errors are logged server-side only.
- **Reset-password relies on Supabase session**: No custom token validation. Supabase email link redirects through `/api/auth/callback` which exchanges the code for a session. By the time the user submits the new password form, `updateUser()` works because the session exists.
- **SEC-1 defense-in-depth**: `NODE_ENV === 'production'` added as the first guard in both `getPlaywrightE2ESession()` and the E2E bootstrap route, before the existing `PLAYWRIGHT_E2E` check.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Supabase Auth email templates should already be configured (from Phase 3 Plan 01).

## Next Phase Readiness
- AUTH-05 (password reset) and AUTH-06 (magic link) complete
- All 3 UI forms now have functioning backend routes
- SEC-1 resolved: E2E bypass hardened for production
- Ready for Phase 3 Plans 03-04 (remaining auth requirements)

## Self-Check: PASSED

- All 5 files verified (3 created, 2 modified)
- Both task commits verified (c9bc722, 72644e3)
- type-check: clean
- lint: clean (0 warnings)

---
*Phase: 03-authentication-core*
*Completed: 2026-02-19*
