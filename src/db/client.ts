import * as pgSchema from './schema/postgres';
import * as sqliteSchema from './schema/sqlite';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { DbProvider } from './schema/types';

/**
 * Multi-database factory.
 *
 * Selects the correct driver + schema based on DB_PROVIDER env var.
 * Exports a single `db` (and `dbEdge`) typed with PG schema as canonical source.
 * At runtime, the actual dialect's tables/driver are used — the type cast is safe
 * because Drizzle's query API is structurally identical across dialects.
 *
 * Switch targets by changing ONE env var: DB_PROVIDER=postgres|sqlite|d1
 */

// PG schema types are the compile-time canonical source
type CanonicalSchema = typeof pgSchema;
type CanonicalDb = PostgresJsDatabase<CanonicalSchema>;

export const DB_PROVIDER: DbProvider =
  (process.env.DB_PROVIDER as DbProvider | undefined) ?? 'postgres';

// ---------------------------------------------------------------------------
// Database client initialization
// ---------------------------------------------------------------------------

function initDb(): CanonicalDb {
  switch (DB_PROVIDER) {
    case 'sqlite': {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createSqliteDb } = require('./adapters/sqlite') as typeof import('./adapters/sqlite');
      return createSqliteDb() as unknown as CanonicalDb;
    }
    case 'd1': {
      // D1 requires Cloudflare Worker binding — use createD1Db() directly in worker context
      throw new Error(
        'D1 provider cannot be initialized at module level. ' +
          'Use createD1Db(env.DB) from @/db/adapters/d1 in your Cloudflare Worker.'
      );
    }
    default: {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createPostgresDb } =
        require('./adapters/postgres') as typeof import('./adapters/postgres');
      return createPostgresDb() as unknown as CanonicalDb;
    }
  }
}

function initEdgeDb(): CanonicalDb {
  switch (DB_PROVIDER) {
    case 'sqlite':
      // SQLite is single-process — no edge/node split needed
      return db;
    case 'd1':
      throw new Error('D1 edge db: use createD1Db(env.DB) directly.');
    default: {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createPostgresEdgeDb } =
        require('./adapters/postgres') as typeof import('./adapters/postgres');
      return createPostgresEdgeDb() as unknown as CanonicalDb;
    }
  }
}

/**
 * Node.js runtime client
 * Use for: API routes, Server Actions, cron jobs
 */
export const db: CanonicalDb = initDb();

/**
 * Edge runtime client (Neon HTTP for PG, same instance for SQLite)
 * Use for: Middleware, Edge API routes
 */
export const dbEdge: CanonicalDb = initEdgeDb();

export type Database = typeof db;

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
  userRelations,
  workspaceRelations,
  workspaceMemberRelations,
  subscriptionRelations,
  workspaceInvitationRelations,
  sessionRelations,
  accountRelations,
} = activeSchema;
