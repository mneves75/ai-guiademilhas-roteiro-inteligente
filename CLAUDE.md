# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun dev                    # Start dev server on localhost:3000
bun build                  # Production build
bun start                  # Start production server

# Code Quality
bun lint                   # ESLint (zero warnings allowed)
bun type-check             # TypeScript strict mode check
bun format                 # Prettier format all files

# Testing
bun test                   # Run unit tests (Vitest)
bun test:watch             # Watch mode
bun test:coverage          # With coverage report
bun test:e2e               # Run E2E tests (Playwright)
bun test:e2e:ui            # Playwright UI mode

# Database (Drizzle ORM)
bun db:push                # Push schema to database
bun db:generate            # Generate migrations
bun db:migrate             # Run migrations
bun db:studio              # Open Drizzle Studio GUI
bun db:seed                # Seed database
bun db:reset               # Reset and reseed
```

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
