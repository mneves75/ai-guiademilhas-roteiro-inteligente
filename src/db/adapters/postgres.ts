import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../schema/postgres';
import { requireDatabaseUrl } from '../env';

type Schema = typeof schema;

/**
 * Node.js runtime client (postgres.js driver)
 * Use for: API routes, Server Actions, cron jobs
 */
export function createPostgresDb(): PostgresJsDatabase<Schema> {
  const url = requireDatabaseUrl('postgres');
  return drizzle(postgres(url, { prepare: false }), { schema, casing: 'snake_case' });
}

/**
 * Edge runtime client (postgres.js with Supabase connection pooler)
 * Use for: Middleware, Vercel Edge Functions
 *
 * Supabase connection pooler supports postgres.js, so we use the same driver
 * for both Node and Edge (no more Neon HTTP driver).
 */
export function createPostgresEdgeDb(): PostgresJsDatabase<Schema> {
  const url = requireDatabaseUrl('edge');
  return drizzle(postgres(url, { prepare: false }), { schema, casing: 'snake_case' });
}
