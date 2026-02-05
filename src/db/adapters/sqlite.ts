import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
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
  const dbPath = process.env.SQLITE_PATH ?? './data/app.db';

  // Ensure parent directory exists
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');

  return drizzle(sqlite, { schema });
}
