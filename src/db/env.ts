import { z } from 'zod';
import type { DbProvider } from './schema/types';

const dbProviderSchema = z.enum(['postgres', 'sqlite', 'd1']);

export function resolveDbProvider(raw: string | undefined): DbProvider {
  const value = raw ?? 'postgres';
  const parsed = dbProviderSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`DB_PROVIDER="${value}" is invalid. Accepted values: postgres | sqlite | d1`);
  }
  return parsed.data;
}

export function getSqlitePath(): string {
  return process.env.SQLITE_PATH ?? './data/app.db';
}

export function requireDatabaseUrl(context: 'postgres' | 'edge'): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (context === 'edge') {
      throw new Error(
        'DATABASE_URL is required for edge runtime. Set it in .env or environment variables.'
      );
    }
    throw new Error(
      'DATABASE_URL is required when DB_PROVIDER=postgres. Set it in .env or environment variables.'
    );
  }
  return url;
}
