import { defineConfig } from 'drizzle-kit';

/**
 * Default drizzle-kit config — resolves based on DB_PROVIDER env var.
 *
 * For explicit dialect configs, use:
 *   drizzle-kit generate --config=drizzle.config.postgres.ts
 *   drizzle-kit generate --config=drizzle.config.sqlite.ts
 *   drizzle-kit generate --config=drizzle.config.d1.ts
 */
const provider = process.env.DB_PROVIDER ?? 'postgres';

const VALID_PROVIDERS = new Set(['postgres', 'sqlite', 'd1']);
if (!VALID_PROVIDERS.has(provider)) {
  throw new Error(
    `DB_PROVIDER="${provider}" is invalid for drizzle-kit. Accepted: postgres | sqlite | d1`
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for DB_PROVIDER=${provider}`);
  return value;
}

const config =
  provider === 'sqlite'
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
    : provider === 'd1'
      ? defineConfig({
          schema: './src/db/schema/sqlite.ts',
          out: './src/db/migrations/sqlite',
          dialect: 'sqlite',
          driver: 'd1-http',
          dbCredentials: {
            accountId: requireEnv('CLOUDFLARE_ACCOUNT_ID'),
            databaseId: requireEnv('CLOUDFLARE_DATABASE_ID'),
            token: requireEnv('CLOUDFLARE_D1_TOKEN'),
          },
          casing: 'snake_case',
          migrations: { prefix: 'index' },
        })
      : defineConfig({
          schema: './src/db/schema/postgres.ts',
          out: './src/db/migrations/postgres',
          dialect: 'postgresql',
          dbCredentials: {
            url: requireEnv('DATABASE_URL'),
          },
          casing: 'snake_case',
          migrations: { prefix: 'index' },
        });

export default config;
