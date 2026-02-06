import { defineConfig } from 'drizzle-kit';

// Cloudflare D1 (remote) via HTTP driver.
// Requires:
// - CLOUDFLARE_ACCOUNT_ID
// - CLOUDFLARE_DATABASE_ID
// - CLOUDFLARE_D1_TOKEN
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for D1 drizzle-kit config`);
  return value;
}

export default defineConfig({
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
  migrations: {
    prefix: 'index',
  },
});
