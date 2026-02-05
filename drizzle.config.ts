import { defineConfig } from 'drizzle-kit';

/**
 * Default drizzle-kit config — resolves based on DB_PROVIDER env var.
 *
 * For explicit dialect configs, use:
 *   drizzle-kit generate --config=drizzle.config.postgres.ts
 *   drizzle-kit generate --config=drizzle.config.sqlite.ts
 */
const provider = process.env.DB_PROVIDER ?? 'postgres';

export default provider === 'sqlite'
  ? defineConfig({
      schema: './src/db/schema/sqlite.ts',
      out: './src/db/migrations/sqlite',
      dialect: 'sqlite',
      dbCredentials: {
        url: process.env.SQLITE_PATH ?? './data/app.db',
      },
      casing: 'snake_case',
      migrations: { prefix: 'index' },
    })
  : defineConfig({
      schema: './src/db/schema/postgres.ts',
      out: './src/db/migrations/postgres',
      dialect: 'postgresql',
      dbCredentials: {
        url: process.env.DATABASE_URL!,
      },
      casing: 'snake_case',
      migrations: { prefix: 'index' },
    });
