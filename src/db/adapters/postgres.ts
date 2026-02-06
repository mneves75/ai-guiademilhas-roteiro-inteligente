import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleNeon, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import postgres from 'postgres';
import { neon } from '@neondatabase/serverless';
import * as schema from '../schema/postgres';

type Schema = typeof schema;

/**
 * Node.js runtime client (postgres.js driver)
 * Use for: API routes, Server Actions, cron jobs
 */
export function createPostgresDb(): PostgresJsDatabase<Schema> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is required when DB_PROVIDER=postgres. ' +
        'Set it in .env or environment variables.'
    );
  }
  return drizzle(postgres(process.env.DATABASE_URL), { schema, casing: 'snake_case' });
}

/**
 * Edge runtime client (Neon HTTP driver)
 * Use for: Middleware, Vercel Edge Functions
 */
export function createPostgresEdgeDb(): NeonHttpDatabase<Schema> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is required for edge runtime. ' + 'Set it in .env or environment variables.'
    );
  }
  return drizzleNeon(neon(process.env.DATABASE_URL), { schema, casing: 'snake_case' });
}
