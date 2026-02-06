import { defineConfig } from 'drizzle-kit';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for Postgres drizzle-kit config`);
  return value;
}

export default defineConfig({
  schema: './src/db/schema/postgres.ts',
  out: './src/db/migrations/postgres',
  dialect: 'postgresql',
  dbCredentials: {
    url: requireEnv('DATABASE_URL'),
  },
  casing: 'snake_case',
  migrations: {
    prefix: 'index',
  },
});
