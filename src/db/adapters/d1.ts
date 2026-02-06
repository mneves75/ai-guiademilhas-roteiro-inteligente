import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '../schema/sqlite';

type Schema = typeof schema;

/**
 * Cloudflare D1 client
 * Use for: Cloudflare Workers deployments
 *
 * D1 uses the SQLite schema since D1 IS SQLite.
 * The D1 binding is passed from the Cloudflare Worker request context.
 *
 * Usage in a Cloudflare Worker:
 *   const db = createD1Db(env.DB);
 */
export function createD1Db(d1Binding: unknown): DrizzleD1Database<Schema> {
  return drizzle(d1Binding as D1Database, { schema, casing: 'snake_case' });
}

// D1Database type — only available in Cloudflare Workers runtime
// Declared here to avoid requiring @cloudflare/workers-types globally
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface D1Database {}
}
