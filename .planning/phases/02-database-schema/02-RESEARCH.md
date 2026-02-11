# Phase 2: Database & Schema - Research

**Researched:** February 5, 2026
**Domain:** PostgreSQL + Drizzle ORM, schema design, migrations, multi-tenant isolation
**Confidence:** HIGH (verified with official Drizzle, Better Auth, Neon docs and 2025-2026 ecosystem sources)

## Summary

Phase 2 establishes the database foundation that subsequent phases (Auth, Payments, Teams) depend on. The standard approach uses Drizzle ORM with PostgreSQL (Neon), which provides type-safe queries, lightweight overhead (~7.4kb), and edge-compatibility. Key decisions center on:

- **Schema structure**: Base entity pattern (id, created_at, updated_at, deleted_at) applied consistently
- **Better Auth compatibility**: Requires user, session, account, verification tables (auto-generated via CLI)
- **Soft delete implementation**: Use deleted_at timestamp column with application-level filtering (not database triggers)
- **Multi-tenant isolation**: Application-level tenant_id filtering with optional PostgreSQL Row-Level Security (RLS) for defense-in-depth
- **Connection pooling**: Use Neon's integrated PgBouncer (pooled connection string) for serverless workloads
- **Migrations**: Generate SQL files (generate + migrate) for production, push for local development

**Primary recommendation:** Set up Drizzle schema with base entity timestamps, generate Better Auth tables, define workspace/subscription tables with workspace_id for isolation, use soft deletes throughout, and use generate+migrate workflow for production safety.

---

## Standard Stack

### Core Libraries

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Drizzle ORM** | 0.38+ | Type-safe database access | Lightweight (~7.4kb), zero runtime dependencies, edge-compatible (Vercel, Cloudflare Workers), superior TypeScript ergonomics over Prisma, supports PostgreSQL/MySQL/SQLite |
| **Drizzle Kit** | 0.24+ | Schema migrations & tooling | Auto-generates SQL migrations from TypeScript schema, visual database studio, supports push/generate/pull workflows |
| **PostgreSQL** | 15+ (Neon) | Primary relational database | ACID-compliant, industry standard for SaaS, better for financial data than MongoDB, Neon adds serverless autoscaling |
| **Neon** | (PostgreSQL 15+) | Serverless PostgreSQL host | Vercel-integrated, PgBouncer for connection pooling, branching for staging, auto-scaling, $0.35/GB storage, compute reduced 15-25% post-Databricks |
| **Better Auth** | 0.14+ | Authentication framework | Self-hosted (user data stays in DB), TypeScript-first, supports passkeys/social auth/2FA, YC-backed, provides schema generator |

### Driver & Connection

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@neondatabase/serverless** | Latest | Serverless PostgreSQL driver | For Vercel Edge Functions, reduced latency, connection pooling built-in |
| **pg** | 8.x | Node.js PostgreSQL driver | For Node.js runtime (API routes, Server Actions), more stable than serverless driver for long-lived connections |

**Installation:**
```bash
pnpm add drizzle-orm postgres @neondatabase/serverless
pnpm add -D drizzle-kit
```

### Configuration Files

**drizzle.config.ts:**
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  casing: "snake_case", // Map TypeScript camelCase to DB snake_case
  migrations: {
    prefix: "index", // Migration naming: 0001_create_users.sql
  },
});
```

**src/db/client.ts:**
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

For Edge Functions (Vercel):
```typescript
import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

---

## Architecture Patterns

### Base Entity Pattern

All tables should inherit a consistent base pattern of timestamp columns. Drizzle provides no built-in base table inheritance, so use object spread to maintain consistency:

```typescript
// src/db/schema.ts
import { pgTable, serial, varchar, timestamp, text, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Reusable timestamp pattern (spread across tables)
const timestamps = {
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
  deletedAt: timestamp(), // null = not deleted
};

export const users = pgTable("users", {
  id: serial().primaryKey(),
  email: varchar(255).notNull().unique(),
  name: varchar(255).notNull(),
  ...timestamps,
});

export const workspaces = pgTable("workspaces", {
  id: serial().primaryKey(),
  name: varchar(255).notNull(),
  ownerUserId: serial().notNull().references(() => users.id),
  ...timestamps,
});

// Soft-deleted: excluded from default queries via application filter
export const subscriptions = pgTable("subscriptions", {
  id: serial().primaryKey(),
  workspaceId: serial().notNull().references(() => workspaces.id),
  stripeSubscriptionId: varchar(255).unique(),
  status: varchar(50).notNull(), // active, canceled, past_due
  ...timestamps,
});
```

### Better Auth Schema Integration

Better Auth requires four tables. Use the CLI to auto-generate:

```bash
npx @better-auth/cli migrate --database-url="postgresql://..." --provider=drizzle
```

This creates:

**users table** (Better Auth managed):
```typescript
export const users = pgTable("users", {
  id: varchar(255).primaryKey(),
  name: varchar(255),
  email: varchar(255).notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: varchar(255),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});
```

**sessions table** (Better Auth managed):
```typescript
export const sessions = pgTable("sessions", {
  id: varchar(255).primaryKey(),
  userId: varchar(255).notNull().references(() => users.id),
  token: varchar(255).notNull().unique(),
  expiresAt: timestamp().notNull(),
  ipAddress: varchar(255),
  userAgent: varchar(255),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});
```

**accounts table** (OAuth providers):
```typescript
export const accounts = pgTable("accounts", {
  id: varchar(255).primaryKey(),
  userId: varchar(255).notNull().references(() => users.id),
  accountId: varchar(255).notNull(),
  providerId: varchar(255).notNull(),
  accessToken: text(),
  refreshToken: text(),
  accessTokenExpiresAt: timestamp(),
  refreshTokenExpiresAt: timestamp(),
  scope: text(),
  idToken: text(),
  password: varchar(255), // For email+password auth
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});
```

**verification table** (Email verification, password reset):
```typescript
export const verification = pgTable("verification", {
  id: varchar(255).primaryKey(),
  identifier: varchar(255).notNull(),
  value: varchar(255).notNull(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp(),
  updatedAt: timestamp(),
});
```

### Relations Pattern

Define relations separately to avoid circular dependencies:

```typescript
// Drizzle relations are for type inference, not foreign keys
export const userRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  sessions: many(sessions),
}));

export const workspaceRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerUserId], references: [users.id] }),
  subscriptions: many(subscriptions),
  members: many(workspaceMembers),
}));

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  workspace: one(workspaces, { fields: [subscriptions.workspaceId], references: [workspaces.id] }),
}));
```

### Recommended Project Structure

```
src/
├── db/
│   ├── schema.ts              # All table definitions + relations
│   ├── client.ts              # Drizzle client instances
│   ├── queries/               # Reusable query helpers
│   │   ├── users.ts           # User queries (with soft delete filter)
│   │   ├── workspaces.ts      # Workspace queries
│   │   └── subscriptions.ts   # Subscription queries
│   └── migrations/            # Auto-generated SQL files (git tracked)
│       ├── 0001_create_tables.sql
│       └── 0002_add_subscription_status.sql
├── lib/
│   └── db.ts                  # Convenience: export from './db/client'
└── app/
    └── api/
        └── [routes]/          # Server actions & API routes
```

### Soft Delete Query Pattern

Create reusable query helpers to filter soft-deleted rows:

```typescript
// src/db/queries/users.ts
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { isNull } from "drizzle-orm";

/**
 * Get user by ID (excludes soft-deleted)
 * Source: Drizzle soft delete pattern (manual filtering)
 */
export async function getUserById(id: number) {
  return db.query.users.findFirst({
    where: (users, { eq, and }) => and(
      eq(users.id, id),
      isNull(users.deletedAt) // Soft delete filter
    ),
  });
}

/**
 * Get all active users (soft delete safe)
 */
export async function getActiveUsers() {
  return db.query.users.findMany({
    where: (users) => isNull(users.deletedAt),
  });
}

/**
 * Soft delete user (set deleted_at, don't remove)
 */
export async function softDeleteUser(id: number) {
  return db
    .update(users)
    .set({ deletedAt: new Date() })
    .where((users) => eq(users.id, id));
}

/**
 * Restore soft-deleted user
 */
export async function restoreUser(id: number) {
  return db
    .update(users)
    .set({ deletedAt: null })
    .where((users) => eq(users.id, id));
}
```

**Key insight:** Soft deletes require discipline. Every query must filter `WHERE deleted_at IS NULL`. Consider creating a query builder helper that auto-applies this filter to reduce forgetting.

### Multi-Tenant Isolation Pattern

Add workspace_id to all tenant-scoped tables and filter at query level:

```typescript
// src/db/queries/workspaces.ts
import { db } from "@/db/client";
import { subscriptions } from "@/db/schema";

/**
 * Get subscriptions for workspace (tenant-scoped)
 * This prevents querying data from other workspaces
 * Source: SaaS multi-tenant pattern (application-level filtering)
 */
export async function getWorkspaceSubscriptions(workspaceId: number) {
  return db.query.subscriptions.findMany({
    where: (subscriptions, { eq, and, isNull }) => and(
      eq(subscriptions.workspaceId, workspaceId), // CRITICAL: tenant isolation
      isNull(subscriptions.deletedAt),
    ),
  });
}

/**
 * Safe wrapper for multi-tenant queries with soft deletes
 */
export async function getWorkspaceData(
  workspaceId: number,
  userId: number // Verify user owns workspace
) {
  // Verify user is member of workspace before querying
  const isMember = await verifyWorkspaceMember(workspaceId, userId);
  if (!isMember) throw new Error("Unauthorized");

  return getWorkspaceSubscriptions(workspaceId);
}
```

**Best practice:** Always include workspace_id in WHERE clause. Add a middleware or helper to enforce this at the route level.

---

## Don't Hand-Roll

Problems that appear simple but require existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Better Auth schema** | Custom user/session tables | Use Better Auth's schema generator (`npx @better-auth/cli migrate`) | Handles passkeys, OAuth, 2FA, verification tokens. Custom implementation misses edge cases. |
| **Soft delete filtering** | Add `.where(deletedAt IS NULL)` everywhere | Create query helper functions (`getUserById()`, `getActiveUsers()`) | Single forgotten filter causes data leak. Helpers ensure consistency. |
| **Tenant isolation** | WHERE workspace_id = $1 in each query | Application middleware + RLS (optional) | Easy to forget filter. Database enforcement prevents bugs. |
| **Connection pooling** | Roll your own pool | Use Neon's PgBouncer (pooled connection string) | Serverless functions create/destroy many connections. Manual pooling adds complexity. |
| **Stripe subscription schema** | Custom subscriptions table | Use Stripe webhook events + minimal local table (id, stripe_id, status, workspace_id) | Stripe is source of truth. Local table just references it. |
| **Migration versioning** | Manual SQL files | drizzle-kit generate (auto-versions with timestamps) | Prevents conflicts, ensures audit trail, integrates with CI/CD. |
| **Development seed data** | INSERT statements | drizzle-seed package (deterministic faker) | Reproducible, idempotent, supports relations and cyclic tables. |

**Key insight:** Better Auth schema, soft delete helpers, and tenant isolation are the three areas where teams most often make mistakes that cause production bugs.

---

## Common Pitfalls

### Pitfall 1: Forgotten Soft Delete Filters

**What goes wrong:** Query written without `WHERE deleted_at IS NULL` returns deleted records, breaking user experience or exposing data.

**Why it happens:** Soft delete filtering isn't enforced by the database. One developer forgets the filter, code ships, deleted data reappears.

**How to avoid:**
1. Create reusable query helpers (as shown above)
2. Add ESLint rule to catch raw SQL without soft delete filters
3. Code review checklist: "Does this query filter deleted records?"

**Warning signs:**
- Deleted items reappear in lists
- Admin reports seeing "ghost" records
- Restored users suddenly get access to past subscriptions

### Pitfall 2: Connection Pool Exhaustion in Serverless

**What goes wrong:** Each Vercel function instance creates a new database connection. With 50+ concurrent requests, connection pool exhausted, timeouts spike.

**Why it happens:** Serverless functions are stateless. Without pooling, each request spawns a new connection.

**How to avoid:**
1. Use Neon's pooled connection string (hostname contains `-pooler`)
2. Use `@neondatabase/serverless` driver for Edge Functions
3. Don't open multiple connections per function (reuse exported `db` instance)
4. Monitor Neon dashboard: "Active connections" gauge

**Warning signs:**
- Database queries timeout during traffic spikes
- Neon error logs show "too many connections"
- Performance degrades under 50+ concurrent users

### Pitfall 3: Using `push` in Production

**What goes wrong:** `drizzle-kit push` directly modifies production database with no migration history, no rollback, no audit trail.

**Why it happens:** `push` is convenient for development, team forgets to switch to `generate+migrate` for production.

**How to avoid:**
1. **Local/dev only:** Use `drizzle-kit push` (fast iteration)
2. **Production only:** Use `drizzle-kit generate` (creates SQL files), then apply via `migrate()` or `drizzle-kit migrate`
3. Add pre-commit hook to prevent committing schema changes without migrations
4. CI/CD rule: Production deployments must include migration files

**Warning signs:**
- No migration history in git
- Can't explain what changed in production database
- Rolling back requires manual SQL (error-prone)

### Pitfall 4: Multi-Tenant Data Leak (Missing workspace_id Filter)

**What goes wrong:** Developer queries subscriptions without `WHERE workspace_id = $1`, accidentally returns all workspace subscriptions.

**Why it happens:** Tenant isolation is application-level responsibility. Easy to miss in one query.

**How to avoid:**
1. Add workspace_id to every tenant-scoped table
2. Create query helpers that auto-inject workspace_id
3. (Optional, stronger) Enable PostgreSQL RLS with policies
4. Code review: "Did this query scope to the current workspace?"

**Warning signs:**
- Cross-tenant queries return data
- User A sees User B's subscriptions
- Stripe webhook creates subscription for wrong workspace

### Pitfall 5: Soft Delete Cascade Complexity

**What goes wrong:** Delete user → should cascade to workspaces, subscriptions, sessions. Without ON DELETE CASCADE, orphaned records remain.

**Why it happens:** Soft deletes don't cascade automatically. Each table needs explicit cascade logic.

**How to avoid:**
1. For workspace deletion: manually delete all workspace_members, subscriptions first
2. Don't rely on database cascades for soft deletes (they're hard deletes)
3. Document cascade order in migration comments
4. Write integration tests for delete flows

**Warning signs:**
- Deleted workspaces still appear in queries (if filter forgotten)
- Orphaned subscription records with null workspace_id
- Performance degradation from filtering massive soft-deleted tables

### Pitfall 6: Better Auth Schema Mismatch

**What goes wrong:** Custom user table with different field names conflicts with Better Auth expectations (emailVerified, createdAt, updatedAt).

**Why it happens:** Better Auth requires specific schema. Custom implementation misses a field.

**How to avoid:**
1. Use `npx @better-auth/cli migrate` to auto-generate schema
2. Don't modify table names or core field names
3. Extend Better Auth schema (add fields to user table) only via migrations, not schema redefinition
4. Reference official Better Auth docs when customizing

**Warning signs:**
- Authentication fails with "field not found"
- Password reset tokens don't create verification records
- OAuth login doesn't create account records

---

## Code Examples

### Example 1: Create Complete Schema with Base Entities

Source: Drizzle ORM documentation + SaaS best practices

```typescript
// src/db/schema.ts
import { pgTable, serial, varchar, timestamp, text, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Base timestamps (reuse across tables)
const timestamps = {
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
  deletedAt: timestamp(),
};

// ==================== BETTER AUTH TABLES ====================
// (These are auto-generated by @better-auth/cli, shown for reference)

export const users = pgTable("users", {
  id: varchar(255).primaryKey(),
  name: varchar(255),
  email: varchar(255).notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: varchar(255),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});

export const sessions = pgTable("sessions", {
  id: varchar(255).primaryKey(),
  userId: varchar(255).notNull().references(() => users.id),
  token: varchar(255).notNull().unique(),
  expiresAt: timestamp().notNull(),
  ipAddress: varchar(255),
  userAgent: varchar(255),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});

export const accounts = pgTable("accounts", {
  id: varchar(255).primaryKey(),
  userId: varchar(255).notNull().references(() => users.id),
  accountId: varchar(255),
  providerId: varchar(255),
  accessToken: text(),
  refreshToken: text(),
  accessTokenExpiresAt: timestamp(),
  refreshTokenExpiresAt: timestamp(),
  scope: text(),
  idToken: text(),
  password: varchar(255),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});

export const verification = pgTable("verification", {
  id: varchar(255).primaryKey(),
  identifier: varchar(255),
  value: varchar(255),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp(),
  updatedAt: timestamp(),
});

// ==================== CUSTOM APP TABLES ====================

export const workspaces = pgTable("workspaces", {
  id: serial().primaryKey(),
  name: varchar(255).notNull(),
  slug: varchar(255).notNull().unique(),
  ownerUserId: varchar(255).notNull().references(() => users.id),
  ...timestamps,
});

export const workspaceMembers = pgTable("workspace_members", {
  id: serial().primaryKey(),
  workspaceId: serial().notNull().references(() => workspaces.id),
  userId: varchar(255).notNull().references(() => users.id),
  role: varchar(50).notNull().default("member"), // owner, member, viewer
  ...timestamps,
});

export const subscriptions = pgTable("subscriptions", {
  id: serial().primaryKey(),
  workspaceId: serial().notNull().references(() => workspaces.id),
  stripeCustomerId: varchar(255).unique(),
  stripeSubscriptionId: varchar(255).unique(),
  stripePriceId: varchar(255),
  status: varchar(50).notNull(), // active, canceled, past_due, paused, incomplete
  currentPeriodStart: timestamp(),
  currentPeriodEnd: timestamp(),
  cancelAtPeriodEnd: boolean().default(false),
  ...timestamps,
});

// ==================== RELATIONS ====================

export const userRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  workspaceMemberships: many(workspaceMembers),
}));

export const workspaceRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerUserId], references: [users.id] }),
  members: many(workspaceMembers),
  subscriptions: many(subscriptions),
}));

export const workspaceMemberRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceMembers.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
}));

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  workspace: one(workspaces, { fields: [subscriptions.workspaceId], references: [workspaces.id] }),
}));

// ==================== ZODSCHEMAS ====================
// Auto-generate from tables for API validation

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export const selectWorkspaceSchema = createSelectSchema(workspaces);
```

### Example 2: Soft Delete Query Helpers

Source: Drizzle query patterns + SaaS best practices

```typescript
// src/db/queries/workspaces.ts
import { db } from "@/db/client";
import { workspaces, workspaceMembers, subscriptions } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

const INCLUDE_SOFT_DELETED = { includeSoftDeleted: false };

/**
 * Get workspace by ID (soft delete safe)
 * - Filters: workspace exists AND not deleted_at
 */
export async function getWorkspaceById(id: number) {
  return db.query.workspaces.findFirst({
    where: (ws, { eq, and, isNull }) => and(
      eq(ws.id, id),
      isNull(ws.deletedAt),
    ),
    with: {
      owner: true,
    },
  });
}

/**
 * Get all workspaces for user (soft delete safe)
 * - Filters: user is member AND workspace not deleted
 */
export async function getUserWorkspaces(userId: string) {
  return db.query.workspaceMemberships.findMany({
    where: (members, { eq, isNull }) => and(
      eq(members.userId, userId),
      isNull(members.deletedAt),
    ),
    with: {
      workspace: {
        where: (ws, { isNull }) => isNull(ws.deletedAt),
      },
    },
  });
}

/**
 * Soft delete workspace (cascades to members, subscriptions)
 * - Sets deleted_at on workspace
 * - Soft deletes all related workspace_members
 * - Soft deletes all related subscriptions
 */
export async function softDeleteWorkspace(id: number) {
  const now = new Date();

  // Step 1: Soft delete workspace
  await db
    .update(workspaces)
    .set({ deletedAt: now })
    .where(eq(workspaces.id, id));

  // Step 2: Soft delete members (maintain referential integrity)
  await db
    .update(workspaceMembers)
    .set({ deletedAt: now })
    .where(eq(workspaceMembers.workspaceId, id));

  // Step 3: Soft delete subscriptions
  await db
    .update(subscriptions)
    .set({ deletedAt: now })
    .where(eq(subscriptions.workspaceId, id));
}

/**
 * Restore workspace and its members/subscriptions
 */
export async function restoreWorkspace(id: number) {
  await db
    .update(workspaces)
    .set({ deletedAt: null })
    .where(eq(workspaces.id, id));

  await db
    .update(workspaceMembers)
    .set({ deletedAt: null })
    .where(eq(workspaceMembers.workspaceId, id));

  await db
    .update(subscriptions)
    .set({ deletedAt: null })
    .where(eq(subscriptions.workspaceId, id));
}
```

### Example 3: Multi-Tenant Query Helper

Source: SaaS multi-tenant patterns

```typescript
// src/db/queries/multi-tenant.ts
import { db } from "@/db/client";
import { workspaceMembers } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";

/**
 * Verify user is member of workspace
 * - Checks workspace_members table
 * - Returns role (owner, member, viewer)
 * - Fails if user not member or membership soft-deleted
 */
export async function verifyWorkspaceMember(workspaceId: number, userId: string) {
  const member = await db.query.workspaceMembers.findFirst({
    where: (members, { eq, and, isNull }) => and(
      eq(members.workspaceId, workspaceId),
      eq(members.userId, userId),
      isNull(members.deletedAt),
    ),
  });
  return member;
}

/**
 * Get subscriptions for workspace (tenant-isolated)
 * - CRITICAL: workspace_id filter prevents cross-tenant leak
 * - Soft delete safe: excludes deleted_at
 */
export async function getWorkspaceSubscriptions(workspaceId: number, userId: string) {
  // Verify user has access to this workspace
  const member = await verifyWorkspaceMember(workspaceId, userId);
  if (!member) throw new Error("Unauthorized: not workspace member");

  // Now safe to query workspace data
  return db.query.subscriptions.findMany({
    where: (subs, { eq, isNull, and }) => and(
      eq(subs.workspaceId, workspaceId), // CRITICAL: tenant isolation
      isNull(subs.deletedAt),            // Soft delete safe
    ),
  });
}

/**
 * Middleware helper: extract workspace_id from request context
 * Used in all tenant-scoped endpoints to enforce isolation
 */
export async function getWorkspaceIdFromRequest(req: Request) {
  // Example: get from route params or auth context
  const workspaceId = req.headers.get("x-workspace-id");
  if (!workspaceId) throw new Error("Missing workspace context");
  return parseInt(workspaceId, 10);
}
```

### Example 4: Seeding Development Database

Source: drizzle-seed documentation

```typescript
// src/db/seed.ts
import { drizzle } from "drizzle-orm/postgres-js";
import { seed } from "drizzle-seed";
import postgres from "postgres";
import * as schema from "./schema";

async function runSeed() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client, { schema });

  await seed(db, schema).refine((funcs) => ({
    users: funcs.users(
      {
        count: 10,
        columns: {
          name: funcs.firstName(),
          email: funcs.email(),
          emailVerified: true,
        },
      },
      { isOneToOne: true }
    ),
    workspaces: funcs.workspaces(
      {
        count: 5,
        columns: {
          name: funcs.companyName(),
          ownerUserId: funcs.refOne({ ref: schema.users.id }),
        },
      },
      { isOneToOne: true }
    ),
    subscriptions: funcs.subscriptions({
      count: 10,
      columns: {
        workspaceId: funcs.refOne({ ref: schema.workspaces.id }),
        status: funcs.pickOne(["active", "canceled", "past_due"]),
      },
    }),
  })).execute();

  console.log("✓ Seed completed");
  process.exit(0);
}

runSeed().catch(console.error);
```

Add to package.json:
```json
{
  "scripts": {
    "db:seed": "tsx ./src/db/seed.ts",
    "db:reset": "drizzle-kit drop && drizzle-kit migrate && pnpm db:seed"
  }
}
```

### Example 5: Migration Workflow (Generate + Migrate)

Source: drizzle-kit documentation

```bash
# Development: rapid iteration with push
pnpm drizzle-kit push

# Production: generate SQL for version control
pnpm drizzle-kit generate
# Output: src/db/migrations/0001_create_users.sql (git tracked)
# Then apply:
pnpm drizzle-kit migrate

# Alternatively: apply at runtime in production deployment
# (see src/db/client.ts for migrate() call)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| **Prisma ORM** | Drizzle ORM | 2024-2025 | Drizzle is 7.4kb vs Prisma's 1.7MB. Better for edge, serverless. |
| **NextAuth v4** | Better Auth | 2024 | Better Auth is self-hosted, modern TypeScript. NextAuth becoming legacy. |
| **Vercel Postgres** | Neon + Serverless Driver | 2024 | Neon is PgSQL optimized for serverless, lower latency, integrated pooling. |
| **TypeORM, Knex.js** | Drizzle ORM | 2023-2024 | Drizzle's type inference and lightweight footprint became standard. |
| **Manual connection pools** | PgBouncer (Neon) | 2023 | Managed pooling prevents serverless exhaustion. |

**Deprecated/outdated:**
- **`drizzle-kit push` for production**: Branches to `generate+migrate` workflow (no audit trail in push)
- **Firestore/NoSQL for SaaS**: PostgreSQL is standard again (ACID, transactions, soft deletes easier)
- **Database per tenant**: Shared database with row-level security is modern multi-tenant pattern

---

## Connection Pooling Deep Dive

### Why Connection Pooling Matters for Serverless

Each serverless function is stateless. Without pooling:
- Function A creates connection → queries → connection idle
- Function B (milliseconds later) creates NEW connection (pool doesn't exist)
- 50 concurrent requests = 50 connections → pool exhaustion

With Neon pooled connection string:
- Function A creates connection through PgBouncer → query → connection returns to pool
- Function B reuses pooled connection → zero latency
- 50 concurrent functions use 5-10 actual connections

### Configuration

**Neon Pooled Connection:**
```
postgres://user:password@hostname-pooler.neon.tech/dbname?sslmode=require
                                    ^^^^^^
                                    Key: -pooler suffix
```

**In `drizzle.config.ts`:**
```typescript
dbCredentials: {
  url: process.env.DATABASE_URL!, // Use pooled connection for serverless
},
```

**Performance metrics:**
- Without pooling: 200-500ms per cold connection
- With pooling: 10-50ms after initial connection
- Neon supports up to 10,000 concurrent connections via PgBouncer

---

## Migration Best Practices

### Recommended Workflow: Generate + Migrate

**For Development:**
```bash
# 1. Change schema
# 2. Sync with local database (fast)
pnpm drizzle-kit push

# 3. Inspect what changed (optional)
pnpm drizzle-kit studio  # Visual database explorer
```

**For Production:**
```bash
# 1. Change schema in TypeScript
# 2. Generate SQL migration file (git-tracked)
pnpm drizzle-kit generate
# Output: src/db/migrations/0001_create_tables.sql

# 3. Commit migration file
git add src/db/migrations/
git commit -m "db: add subscription status column"

# 4. Apply migration (during deployment)
pnpm drizzle-kit migrate
# Or runtime: import { migrate } from "drizzle-orm/postgres-js/migrator"
```

### Migration File Organization

```
src/db/migrations/
├── 0001_initial_schema.sql          # Initial tables
├── 0002_add_soft_delete.sql         # Add deleted_at columns
├── 0003_create_workspace_tables.sql # Add workspace schema
└── meta/
    └── _journal.json                # Drizzle auto-manages
```

### Handling Rollbacks

**Problem:** `drizzle-kit push` has no rollback (no migration history)

**Solution:** Use `generate + migrate` so you have SQL history

**If you need to rollback:**
1. Create new migration: `ALTER TABLE users DROP COLUMN deleted_at;`
2. Manually write DOWN migration (Drizzle doesn't auto-generate rollbacks)
3. Test in staging first
4. Apply via `drizzle-kit migrate`

---

## Open Questions

1. **Row-Level Security (RLS) vs. Application Filtering**
   - What we know: RLS provides database-level enforcement (stronger). Application filtering is easier to implement but error-prone (one forgotten WHERE clause = data leak).
   - What's unclear: How much RLS overhead for typical SaaS (10-100 concurrent users)?
   - Recommendation: Start with application-level filtering (easier, Drizzle helpers). Add RLS later if needed for compliance (SOC 2, HIPAA).

2. **Connection Pool Size for Neon**
   - What we know: Default is 10,000 connections. Typical SaaS uses 5-50.
   - What's unclear: What's the right size for 1,000 concurrent users?
   - Recommendation: Monitor Neon dashboard. Start with default, scale down if not needed.

3. **Soft Delete Indexes**
   - What we know: Soft deletes mean large tables (deleted records never removed).
   - What's unclear: Should we index on (workspace_id, deleted_at) separately?
   - Recommendation: Yes, for large tables (>100k rows): `CREATE INDEX idx_subscriptions_workspace_deleted ON subscriptions(workspace_id, deleted_at);`

---

## Sources

### Primary (HIGH confidence)

- **Drizzle ORM Official Docs** - [https://orm.drizzle.team/docs/migrations](https://orm.drizzle.team/docs/migrations), [https://orm.drizzle.team/docs/sql-schema-declaration](https://orm.drizzle.team/docs/sql-schema-declaration)
  - Migration workflows, schema declaration, relations
- **Better Auth Official Docs** - [https://www.better-auth.com/docs/concepts/database](https://www.better-auth.com/docs/concepts/database)
  - Database schema requirements (user, session, account, verification tables)
- **Neon Official Docs** - [https://neon.com/docs/connect/connection-pooling](https://neon.com/docs/connect/connection-pooling)
  - Connection pooling with PgBouncer, serverless driver

### Secondary (MEDIUM confidence)

- [Drizzle ORM Soft Delete Discussion](https://github.com/drizzle-team/drizzle-orm/discussions/4031) - Community patterns for soft deletes
- [Neon Serverless Driver GitHub](https://github.com/neondatabase/serverless) - Edge function integration
- [PostgreSQL RLS Best Practices](https://www.thenile.dev/blog/multi-tenant-rls) - Row-level security for multi-tenancy
- [Turso + Drizzle Multi-Tenant](https://turso.tech/blog/creating-a-multitenant-saas-service-with-turso-remix-and-drizzle-6205cf47) - Multi-tenant isolation patterns

### Tertiary (Verified with 2026 ecosystem)

- [Next.js 15 + Drizzle ORM Setup Guide](https://strapi.io/blog/how-to-use-drizzle-orm-with-postgresql-in-a-nextjs-15-project)
- [Drizzle Seeding with drizzle-seed](https://orm.drizzle.team/docs/seed-overview)
- [Neon 2025 Updates on Serverless PostgreSQL](https://dev.to/dataformathub/neon-postgres-deep-dive-why-the-2025-updates-change-serverless-sql-5o0)

---

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH - Verified with official Drizzle, Better Auth, Neon docs
- **Architecture patterns:** HIGH - Official documentation + proven SaaS patterns
- **Soft delete implementation:** MEDIUM-HIGH - Discussed in community but manual implementation (not automated by Drizzle)
- **Multi-tenant isolation:** MEDIUM - Application-level filtering is standard; RLS is optional enhancement
- **Connection pooling:** HIGH - Neon documentation explicitly covers serverless pooling
- **Migrations:** HIGH - drizzle-kit docs clearly distinguish push vs. generate+migrate

**Research date:** February 5, 2026
**Valid until:** March 5, 2026 (library versions stable; plan to re-check if Drizzle 0.40+ or Neon API changes)
