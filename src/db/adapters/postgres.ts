import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleNeon, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import postgres from 'postgres';
import { neon } from '@neondatabase/serverless';
import * as schema from '../schema/postgres';
import { requireDatabaseUrl } from '../env';

type Schema = typeof schema;

/**
 * Node.js runtime client (postgres.js driver)
 * Use for: API routes, Server Actions, cron jobs
 */
export function createPostgresDb(): PostgresJsDatabase<Schema> {
  const url = requireDatabaseUrl('postgres');
  return drizzle(postgres(url), { schema, casing: 'snake_case' });
}

/**
 * Edge runtime client (Neon HTTP driver)
 * Use for: Middleware, Vercel Edge Functions
 */
export function createPostgresEdgeDb(): NeonHttpDatabase<Schema> {
  const url = requireDatabaseUrl('edge');
  return drizzleNeon(neon(url), { schema, casing: 'snake_case' });
}
