# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev                   # Start dev server on localhost:3000
pnpm build                 # Production build
pnpm start                 # Start production server

# Code Quality
pnpm lint                  # ESLint (zero warnings allowed)
pnpm type-check            # TypeScript strict mode check
pnpm format                # Prettier format all files

# Testing
pnpm test                  # Run unit tests (Vitest)
pnpm test:watch            # Watch mode
pnpm test:coverage         # With coverage report
pnpm test:e2e              # Run E2E tests (Playwright)
pnpm test:e2e:ui           # Playwright UI mode

# Database (Drizzle ORM)
pnpm db:push               # Push schema to database
pnpm db:generate           # Generate migrations
pnpm db:migrate            # Run migrations
pnpm db:studio             # Open Drizzle Studio GUI
pnpm db:seed               # Seed database
pnpm db:reset              # Reset and reseed
```

## Health

- `GET /health` and `GET /api/health` - liveness probes for load balancers/uptime checks

## Architecture

### Tech Stack

- **Next.js 16** with App Router, React 19, TypeScript strict mode
- **Database**: PostgreSQL via Neon serverless + Drizzle ORM
- **Auth**: Better Auth (email/password + OAuth)
- **Payments**: Stripe subscriptions
- **Email**: Resend + React Email
- **UI**: shadcn/ui + Radix primitives + Tailwind CSS

### Route Groups

```
app/
├── (auth)/              # Public auth pages (login, signup)
├── (protected)/         # Requires authentication
│   ├── dashboard/       # User dashboard with workspace context
│   └── admin/           # Admin-only (ADMIN_EMAILS env check)
├── blog/                # Public MDX blog
└── api/                 # API routes (auth, stripe, workspaces)
```

### Database Patterns

**Soft deletes everywhere** - All tables have `deletedAt` timestamp. Never hard delete:

```typescript
// ✗ Don't do this
await db.delete(workspaces).where(eq(workspaces.id, id));

// ✓ Do this
await db.update(workspaces).set({ deletedAt: new Date() }).where(eq(workspaces.id, id));
```

**Two DB clients** in `src/db/client.ts`:

- `db` - Node.js runtime (API routes, Server Actions)
- `dbEdge` - Edge runtime (middleware, Vercel Edge)

**Schema location**:

- Postgres schema: `src/db/schema/postgres.ts` (canonical types + drizzle-zod schemas)
- SQLite/D1 schema: `src/db/schema/sqlite.ts` (D1 is SQLite)
- Dialect-agnostic TS types: `src/db/schema/types.ts`

**Seeding**:

- Node (postgres/sqlite): `pnpm db:seed` (runs `src/db/seed.ts`)
- D1 (Cloudflare): `wrangler d1 execute ... --file=src/db/seed.d1.sql`

### Multi-Tenancy

Workspaces provide team isolation. Key tables:

- `workspaces` - Team containers
- `workspaceMembers` - User membership with roles (owner/admin/member)
- `workspaceInvitations` - Token-based invites

Workspace context provided via `src/contexts/workspace-context.tsx`.

### Authentication Flow

Better Auth handles auth at `/api/auth/[...all]`. Key files:

- `src/lib/auth.ts` - Server-side auth config
- `src/lib/auth-client.ts` - Client-side hooks
- `app/(protected)/layout.tsx` - Auth guard for protected routes

Admin access controlled by `ADMIN_EMAILS` env var (comma-separated).

### Stripe Integration

- `src/lib/stripe.ts` - Server client + plan config
- `src/lib/stripe-helpers.ts` - Customer/subscription helpers
- `app/api/stripe/webhook/route.ts` - Handles Stripe events

### Blog System

MDX blog with frontmatter in `content/blog/*.mdx`. Utilities in `src/lib/blog.ts`.

### Email Templates

React Email templates in `src/emails/`. Send via `src/lib/email-actions.ts`.

## Key Conventions

1. **Server Components by default** - Only use `'use client'` when interactivity required
2. **Path alias** - Use `@/` for `src/` imports
3. **Zod validation** - Schema types exported from `src/db/schema.ts`
4. **Pre-commit hooks** - Husky runs lint-staged on commit

## Branch Protection (Recommended)

To keep `main` healthy, enable branch protection with:

- Required review (at least 1 approval)
- Required status check(s): `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`, `pnpm test:e2e:ci`
- Require conversation resolution before merge
