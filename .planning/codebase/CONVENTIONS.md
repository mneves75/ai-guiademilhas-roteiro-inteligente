# CONVENTIONS.md — Code Style & Patterns

> Auto-generated codebase map. Coding conventions and established patterns.

## TypeScript Configuration

- **Strict mode**: `strict: true`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch`
- **Target**: ES2020 with bundler module resolution
- **No `any`**: Use `unknown` + type guards instead
- **Path alias**: `@/` maps to `src/`
- **Incremental**: Enabled for faster rebuilds

## React Conventions

### Server Components First
- Default to Server Components (no directive)
- Add `'use client'` only when interactivity is required (event handlers, hooks, browser APIs)
- Keep client components as leaf nodes

### React 19 + Compiler
- React Compiler handles memoization automatically
- **Do NOT use** manual `useMemo`, `useCallback`, `React.memo`
- Use `useActionState` for form actions (React 19 pattern)

### Component Structure
- shadcn/ui primitives in `src/components/ui/`
- Feature components colocated with their routes or in `src/components/<feature>/`
- `class-variance-authority` for variant-based styling
- `clsx` + `tailwind-merge` for conditional classes

## Database Conventions

### Soft Deletes Everywhere
```typescript
// NEVER hard delete
await db.delete(table).where(...);

// ALWAYS soft delete
await db.update(table).set({ deletedAt: new Date() }).where(...);
```

### Schema Patterns
- All tables include `createdAt`, `updatedAt`, `deletedAt` timestamps
- Shared `timestamps` object spread across tables
- `casing: 'snake_case'` in Drizzle config (JS camelCase → DB snake_case)
- `prepare: false` required for Supabase connection pooler
- PG schema is canonical compile-time type; SQLite/D1 adapt at runtime

### Drizzle-Zod Integration
- `createInsertSchema` / `createSelectSchema` from `drizzle-zod`
- Zod schemas derived from DB schema for validation consistency
- `travelPreferencesSchema` uses `.superRefine().strict()` — use `.innerType()` for `.pick()`

## Error Handling

### API Routes — RFC 9457 Problem+JSON
- Error responses follow RFC 9457 `application/problem+json`
- Shared helpers in `src/lib/planner/problem-response.ts`
- Consistent error shape: `{ type, title, status, detail, instance }`

### Auth Error Mapping
- Supabase error codes mapped to user-friendly messages
- `src/lib/auth/error-utils.ts` — code translation
- `src/lib/auth/ui-errors.ts` — user-facing strings
- Locale-aware error messages (pt-BR / en)

### Security Error Patterns
- Safe JSON parsing via `src/lib/security/safe-json.ts`
- Open redirect prevention via `src/lib/security/redirect.ts`
- Origin validation via `src/lib/security/origin.ts`

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | kebab-case | `use-wizard-form.ts`, `stream-report.ts` |
| Components | PascalCase | `ReportItem`, `WizardForm` |
| Hooks | `use` prefix, camelCase | `useWizardForm`, `usePlannerStream` |
| Constants | SCREAMING_SNAKE | `PROTECTED_PAGE_PREFIXES` |
| DB columns | camelCase (JS) → snake_case (DB) | `createdAt` → `created_at` |
| Env vars | SCREAMING_SNAKE | `DATABASE_URL`, `STRIPE_SECRET_KEY` |
| Test files (unit) | `*.vitest.ts` | `planner-schema.vitest.ts` |
| Test files (E2E) | `*.e2e.ts` | `planner.e2e.ts` |
| API routes | `route.ts` in named dir | `app/api/planner/generate/route.ts` |

## Import Ordering

- `'server-only'` import first (when present)
- External packages
- Internal `@/` imports
- Relative imports

## Logging

- **Pino** for structured JSON logging (`src/lib/logger.ts`)
- Privacy-first: never log PII, tokens, or credentials
- Request IDs via `src/lib/request-id.ts` (propagated in headers)

## Security Conventions

- Security headers set in `next.config.ts` (CSP, HSTS, X-Frame-Options, etc.)
- CSRF protection in `proxy.ts` for state-changing methods
- Rate limiting on auth routes (in-memory + optional Upstash Redis)
- `X-Robots-Tag: noindex` on sensitive routes (/dashboard, /admin, /invite)
- `Permissions-Policy` restricts camera, microphone, geolocation, payment
- API routes: `Cache-Control: no-store, max-age=0`
- Static assets: `Cache-Control: public, max-age=31536000, immutable`

## Internationalization (i18n)

- Two locales: `pt-BR` (default), `en`
- Locale detection: cookie → URL prefix → default pt-BR
- Server-side: `src/lib/locale-server.ts`
- Client-side: `src/lib/locale.ts`
- Routing: `src/lib/locale-routing.ts` (public paths get locale prefix)
- Messages: `src/lib/messages.ts`
- SEO: `src/lib/seo/public-alternates.ts` (hreflang tags)

## Feature Flags

- `ENABLE_REGISTRATION` — toggle signup
- `ENABLE_EMAIL_VERIFICATION` — toggle email verification
- `MAINTENANCE_MODE` — maintenance page
- GrowthBook for A/B testing (optional)

## Code Quality Enforcement

- ESLint 9 flat config, **zero warnings** policy
- Prettier for formatting
- Husky + lint-staged on pre-commit
- TypeScript strict mode with additional checks
- `pnpm verify` runs full pipeline: lint → type-check → test → build → db smoke → E2E
