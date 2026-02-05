import * as pgSchema from './schema/postgres';
import * as sqliteSchema from './schema/sqlite';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { DbProvider } from './schema/types';

/**
 * Multi-database factory.
 *
 * Selects the correct driver + schema based on DB_PROVIDER env var.
 * PG types are the compile-time canonical source. At runtime, the actual
 * dialect's tables and driver are used.
 *
 * TRADE-OFF DOCUMENTADO:
 * O cast `as unknown as CanonicalDb` mente pro TypeScript — o db real pode ser
 * BetterSQLite3Database. Isso funciona porque a query API do Drizzle é
 * estruturalmente idêntica entre dialetos. Se você adicionar features PG-specific
 * (json operators, arrays, etc.), elas vão COMPILAR mas FALHAR no SQLite em runtime.
 * Regra: use apenas a API padrão do Drizzle (query, insert, update, delete, select).
 *
 * LAZY INITIALIZATION:
 * db e dbEdge são Proxies que inicializam a conexão real no primeiro acesso.
 * Isso permite que `next build` importe este módulo sem precisar de DATABASE_URL,
 * já que a conexão só é criada quando uma query é efetivamente executada.
 */

// PG schema types are the compile-time canonical source
type CanonicalSchema = typeof pgSchema;
type CanonicalDb = PostgresJsDatabase<CanonicalSchema>;

const VALID_PROVIDERS = new Set<string>(['postgres', 'sqlite', 'd1']);

function resolveProvider(): DbProvider {
  const raw = process.env.DB_PROVIDER ?? 'postgres';
  if (!VALID_PROVIDERS.has(raw)) {
    throw new Error(`DB_PROVIDER="${raw}" inválido. Valores aceitos: postgres | sqlite | d1`);
  }
  return raw as DbProvider;
}

export const DB_PROVIDER: DbProvider = resolveProvider();

// ---------------------------------------------------------------------------
// Lazy singleton — connection created on first property access, not import
// ---------------------------------------------------------------------------

let _db: CanonicalDb | undefined;
let _dbEdge: CanonicalDb | undefined;

function getDb(): CanonicalDb {
  if (!_db) _db = createDb();
  return _db;
}

function getDbEdge(): CanonicalDb {
  if (!_dbEdge) _dbEdge = createEdgeDb();
  return _dbEdge;
}

/** Wrap a getter in a Proxy so the export looks like a plain object */
function lazy(getter: () => CanonicalDb): CanonicalDb {
  return new Proxy({} as CanonicalDb, {
    get(_, prop) {
      // Prevent Proxy from being treated as a thenable
      if (prop === 'then') return undefined;
      return Reflect.get(getter(), prop);
    },
  });
}

// ---------------------------------------------------------------------------
// Database client creation (called lazily)
// ---------------------------------------------------------------------------

function createDb(): CanonicalDb {
  switch (DB_PROVIDER) {
    case 'sqlite': {
      const { createSqliteDb } = require('./adapters/sqlite') as typeof import('./adapters/sqlite'); // eslint-disable-line @typescript-eslint/no-require-imports
      return createSqliteDb() as unknown as CanonicalDb;
    }
    case 'd1': {
      throw new Error(
        'D1 provider cannot be initialized at module level. ' +
          'Use createD1Db(env.DB) from @/db/adapters/d1 in your Cloudflare Worker.'
      );
    }
    default: {
      const { createPostgresDb } =
        require('./adapters/postgres') as typeof import('./adapters/postgres'); // eslint-disable-line @typescript-eslint/no-require-imports
      return createPostgresDb() as unknown as CanonicalDb;
    }
  }
}

function createEdgeDb(): CanonicalDb {
  switch (DB_PROVIDER) {
    case 'sqlite':
      // SQLite é single-process — edge e node compartilham a mesma instância
      return getDb();
    case 'd1':
      throw new Error('D1 edge db: use createD1Db(env.DB) directly.');
    default: {
      const { createPostgresEdgeDb } =
        require('./adapters/postgres') as typeof import('./adapters/postgres'); // eslint-disable-line @typescript-eslint/no-require-imports
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
  userRelations,
  workspaceRelations,
  workspaceMemberRelations,
  subscriptionRelations,
  workspaceInvitationRelations,
  sessionRelations,
  accountRelations,
} = activeSchema;
