# TESTING.md — Test Structure & Practices

> Auto-generated codebase map. Testing framework, patterns, and coverage.

## Test Stack

| Layer | Tool | Config |
|-------|------|--------|
| Unit | Vitest ^4.0.18 | `vitest.config.ts` |
| E2E | Playwright ^1.58.2 | `playwright.config.ts` |
| DOM | jsdom | Vitest environment |
| React | @testing-library/react | Component testing |
| Coverage | @vitest/coverage-v8 | v8 provider |

## Unit Testing (Vitest)

### Configuration
- Environment: `jsdom`
- Globals: `true` (no explicit imports for `describe`, `it`, `expect`)
- Setup: `src/test/setup.tsx`
- Include: `src/**/*.vitest.{ts,tsx}`
- Exclude: `node_modules`, `.next`, `e2e`
- `server-only` stub: `src/test/stubs/server-only.ts` (allows testing server modules)
- Path alias: `@/` → `./src`

### Test File Locations
All unit tests in `src/lib/__tests__/` with `*.vitest.ts` extension:

**Auth & Security (6 tests)**:
- `auth-invariants.vitest.ts` — auth session invariants
- `auth-error-utils.vitest.ts` — error code mapping
- `auth-ui-errors.vitest.ts` — user-facing error messages
- `security-redirect.vitest.ts` — open redirect prevention
- `origin.vitest.ts` — origin validation
- `prod-config.vitest.ts` — production config validation

**Planner (7 tests)**:
- `planner-schema.vitest.ts` — Zod schema validation
- `planner-types.vitest.ts` — type definitions
- `planner-api-contract.vitest.ts` — API contract checks
- `planner-navigation.vitest.ts` — route helpers
- `planner-generate-route.vitest.ts` — generate route logic
- `planner-generate-stream-route.vitest.ts` — streaming route logic
- `planner-normalize-report.vitest.ts` — report normalization

**Database (3 tests)**:
- `db-client.vitest.ts` — DB client factory
- `db-errors.vitest.ts` — DB error handling
- `schema-parity.vitest.ts` — PG/SQLite schema parity

**Infrastructure (7 tests)**:
- `utils.vitest.ts` — utility functions
- `safe-json.vitest.ts` — safe JSON parsing
- `storage-local.vitest.ts` — local storage provider
- `stripe-helpers.vitest.ts` — Stripe helper functions
- `request-id.vitest.ts` — request ID generation
- `blog.vitest.ts` — blog utilities
- `admin.vitest.ts` — admin helpers

**SEO & Analytics (5 tests)**:
- `seo-routes.vitest.ts` — SEO route generation
- `structured-data.vitest.ts` — JSON-LD structured data
- `public-alternates.vitest.ts` — hreflang alternates
- `funnel.vitest.ts` — conversion funnel
- `funnel-client.vitest.ts` — client funnel helpers
- `funnel-slo.vitest.ts` — funnel SLO checks

**Content (2 tests)**:
- `landing-content.vitest.ts` — landing page content
- (blog test above)

**Total: ~30 unit test files**

### Commands
```bash
pnpm test              # Run all unit tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage report
```

## E2E Testing (Playwright)

### Test Files
Located in `e2e/` directory:

| File | Coverage |
|------|----------|
| `home.e2e.ts` | Landing page rendering |
| `screens.e2e.ts` | Screen/page smoke tests |
| `planner.e2e.ts` | AI planner flow |
| `protected.e2e.ts` | Auth-protected routes |
| `i18n.e2e.ts` | Internationalization |
| `security-headers.e2e.ts` | Security header validation |
| `security-txt.e2e.ts` | security.txt (RFC 9116) |

**Total: 7 E2E test files**

### E2E Auth Strategy
- E2E auth helper: `e2e/helpers/auth.ts`
- Bootstrap endpoint: `POST /api/e2e/auth/bootstrap` (only when `PLAYWRIGHT_E2E=1`)
- Cookie-based fake auth: `e2e_auth` cookie for test sessions
- `getPlaywrightE2ESession()` in `src/lib/auth.ts` returns mock session

### Commands
```bash
pnpm test:e2e          # Run E2E tests
pnpm test:e2e:ui       # Playwright UI mode
pnpm test:e2e:ci       # CI mode (chromium only)
```

## Planner-Specific Tests

### LM Studio Smoke Tests
```bash
pnpm test:planner:lmstudio          # Basic smoke test
pnpm test:planner:lmstudio:soak     # Extended soak test (8 generate + 4 stream)
```
- Script: `scripts/planner-lmstudio-smoke.mjs`
- Gate: `scripts/planner-lmstudio-gate.sh`

## DB Smoke Tests

```bash
pnpm db:smoke              # Full DB smoke test
pnpm db:smoke:pg:local     # PostgreSQL local
pnpm db:smoke:sqlite       # SQLite
pnpm db:schema-parity      # PG/SQLite schema parity check
pnpm db:portability-check  # Dialect portability
```

## Verification Pipeline

### Full Local Verify
```bash
pnpm verify
# Runs: lint → type-check → test → build → db:smoke → test:e2e:ci
```

### CI Verify
```bash
pnpm verify:ci
# Runs: lint → type-check → test → build → db:schema-parity → db:smoke:sqlite → test:e2e:ci
```

### Planner Verify (with LM Studio)
```bash
pnpm verify:planner:local
# Runs: verify + test:planner:lmstudio:soak
```

## Testing Conventions

1. **Bug-first protocol**: When a bug is reported, write a failing test FIRST, then fix
2. **Never close a bug without a regression test**
3. **Unit tests**: `*.vitest.ts` in `src/lib/__tests__/`
4. **E2E tests**: `*.e2e.ts` in `e2e/`
5. **Server-only modules**: Tested via `server-only` stub in Vitest
6. **No manual mocking of Drizzle**: Tests mock at the service boundary, not ORM level
7. **Concurrent E2E**: Lock mechanism via `scripts/with-e2e-lock.sh` prevents parallel build conflicts

## Coverage

- Provider: `@vitest/coverage-v8`
- Reporters: text, JSON, HTML
- Excludes: `node_modules/`, `src/test/`, `*.d.ts`, `*.config.*`, `types/**`
