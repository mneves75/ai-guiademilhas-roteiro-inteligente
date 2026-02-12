import 'server-only';

import * as pgSchema from './schema/postgres';
import * as sqliteSchema from './schema/sqlite';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { DbProvider } from './schema/types';
import { createPostgresDb, createPostgresEdgeDb } from './adapters/postgres';
import { createSqliteDb } from './adapters/sqlite';
import { resolveDbProvider } from './env';

/**
 * Multi-database factory (Node + Edge).
 *
 * What this module guarantees:
 * - Single import location for `db`, `dbEdge`, and table exports.
 * - Lazy initialization: importing the module never connects to a database.
 *
 * What it does NOT (and cannot) guarantee:
 * - Full type-safety across dialects. We intentionally keep Postgres as the
 *   "canonical" compile-time type surface and adapt the runtime driver+schema.
 *
 * First-principles rationale:
 * - Correctness > convenience: we fail fast on unsupported runtime/provider
 *   combos (ex: SQLite on Edge, D1 inside Next.js without a Worker env binding).
 * - Build-time reliability: Next.js may import server modules during `next build`.
 *   Lazy init keeps the build from crashing when `DATABASE_URL` isn't present,
 *   unless code actually touches the DB at build time.
 *
 * Trade-off:
 * - `as unknown as CanonicalDb` is a deliberate type lie. It keeps a stable API
 *   surface for the app, but PG-specific SQL features may compile and fail at
 *   runtime when DB_PROVIDER != postgres. Keep queries Drizzle-portable.
 */

// PG schema types are the compile-time canonical source
type CanonicalSchema = typeof pgSchema;
type CanonicalDb = PostgresJsDatabase<CanonicalSchema>;

export const DB_PROVIDER: DbProvider = resolveDbProvider(process.env.DB_PROVIDER);

// ---------------------------------------------------------------------------
// Lazy singleton — connection created on first property access, not import
// ---------------------------------------------------------------------------

declare global {
  var __db: CanonicalDb | undefined;
  var __dbEdge: CanonicalDb | undefined;
}

const globalForDb = globalThis as typeof globalThis & {
  __db?: CanonicalDb;
  __dbEdge?: CanonicalDb;
};

let _db: CanonicalDb | undefined = globalForDb.__db;
let _dbEdge: CanonicalDb | undefined = globalForDb.__dbEdge;

function getDb(): CanonicalDb {
  if (!_db) {
    _db = createDb();
    globalForDb.__db = _db;
  }
  return _db;
}

function getDbEdge(): CanonicalDb {
  if (!_dbEdge) {
    _dbEdge = createEdgeDb();
    globalForDb.__dbEdge = _dbEdge;
  }
  return _dbEdge;
}

/** Wrap a getter in a Proxy so the export looks like a plain object */
function lazy(getter: () => CanonicalDb): CanonicalDb {
  return new Proxy({} as CanonicalDb, {
    get(_, prop) {
      // Prevent Proxy from being treated as a thenable
      if (prop === 'then') return undefined;

      const target = getter();
      const value = Reflect.get(target, prop, target);

      // Some libraries call methods with `this` binding expectations.
      if (typeof value === 'function') return value.bind(target);

      return value;
    },
  });
}

// ---------------------------------------------------------------------------
// Database client creation (called lazily)
// ---------------------------------------------------------------------------

function createDb(): CanonicalDb {
  switch (DB_PROVIDER) {
    case 'sqlite': {
      return createSqliteDb() as unknown as CanonicalDb;
    }
    case 'd1': {
      throw new Error(
        'D1 provider cannot be initialized at module level. ' +
          'Use createD1Db(env.DB) from @/db/adapters/d1 in your Cloudflare Worker.'
      );
    }
    default: {
      return createPostgresDb() as unknown as CanonicalDb;
    }
  }
}

function createEdgeDb(): CanonicalDb {
  switch (DB_PROVIDER) {
    case 'sqlite':
      throw new Error(
        'SQLite provider is not supported in Edge runtime (better-sqlite3 is Node-only). ' +
          'Use DB_PROVIDER=postgres for Edge routes, or avoid DB access in middleware/edge.'
      );
    case 'd1':
      throw new Error('D1 edge db: use createD1Db(env.DB) directly.');
    default: {
      return createPostgresEdgeDb() as unknown as CanonicalDb;
    }
  }
}

/**
 * Node.js runtime client (lazy — connects on first use)
 * Use for: API routes, Server Actions, cron jobs
 */
export const db: CanonicalDb = lazy(getDb);

/**
 * Edge runtime client (lazy — connects on first use)
 * Use for: Middleware, Edge API routes
 */
export const dbEdge: CanonicalDb = lazy(getDbEdge);

export type Database = CanonicalDb;

// ---------------------------------------------------------------------------
// Active schema table references
// ---------------------------------------------------------------------------
// At runtime, these point to the correct dialect's table objects.
// TypeScript sees PG types (canonical), but the runtime objects match the db driver.

const activeSchema: CanonicalSchema =
  DB_PROVIDER === 'sqlite' || DB_PROVIDER === 'd1'
    ? (sqliteSchema as unknown as CanonicalSchema)
    : pgSchema;

export const {
  users,
  sessions,
  accounts,
  verification,
  workspaces,
  workspaceMembers,
  workspaceInvitations,
  subscriptions,
  stripeEvents,
  userRelations,
  workspaceRelations,
  workspaceMemberRelations,
  subscriptionRelations,
  workspaceInvitationRelations,
  sessionRelations,
  accountRelations,
  sharedReports,
  sharedReportRelations,
  plans,
  planRelations,
} = activeSchema;
