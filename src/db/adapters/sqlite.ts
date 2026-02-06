import type { Database as BetterSqlite3Database } from 'better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema/sqlite';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

type Schema = typeof schema;

/**
 * SQLite client (better-sqlite3 driver)
 * Use for: VPS deployments with local SQLite
 *
 * Enables WAL mode for concurrent reads and foreign keys for referential integrity.
 * Auto-creates the database directory if it doesn't exist.
 */
export function createSqliteDb(): BetterSQLite3Database<Schema> {
  // Defer loading native deps until the provider is actually selected.
  // This avoids failing builds/environments that don't install optional native deps.
  /* eslint-disable @typescript-eslint/no-require-imports */
  const BetterSqlite3 = require('better-sqlite3') as unknown;
  const { drizzle } =
    require('drizzle-orm/better-sqlite3') as typeof import('drizzle-orm/better-sqlite3');
  /* eslint-enable @typescript-eslint/no-require-imports */

  const dbPath = process.env.SQLITE_PATH ?? './data/app.db';

  // Ensure parent directory exists
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const DatabaseCtor =
    (BetterSqlite3 as { default?: new (...args: never[]) => unknown }).default ??
    (BetterSqlite3 as new (...args: never[]) => unknown);
  const sqlite = new (DatabaseCtor as unknown as new (path: string) => BetterSqlite3Database)(
    dbPath
  );
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');

  return drizzle(sqlite, { schema, casing: 'snake_case' });
}
