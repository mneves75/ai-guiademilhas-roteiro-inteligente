import { drizzle } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import postgres from 'postgres';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

/**
 * Node.js runtime client
 * Use for: API routes, Server Actions, cron jobs
 */
export const db = drizzle(postgres(process.env.DATABASE_URL!), { schema });

/**
 * Edge runtime client (Vercel Edge Functions)
 * Use for: Middleware, Edge API routes
 * Uses Neon HTTP driver for serverless environments
 */
export const dbEdge = drizzleNeon(neon(process.env.DATABASE_URL!), { schema });

export type Database = typeof db;
