import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/postgres.ts',
  out: './src/db/migrations/postgres',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  casing: 'snake_case',
  migrations: {
    prefix: 'index',
  },
});
