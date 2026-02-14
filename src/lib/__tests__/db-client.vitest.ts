import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

function restoreEnvKey(key: string) {
  const value = ORIGINAL_ENV[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

function clearTestEnv() {
  delete process.env.DB_PROVIDER;
  delete process.env.DATABASE_URL;
  delete process.env.SQLITE_PATH;
}

function restoreEnv() {
  restoreEnvKey('DB_PROVIDER');
  restoreEnvKey('DATABASE_URL');
  restoreEnvKey('SQLITE_PATH');
}

function clearGlobalDbSingletons() {
  // src/db/client.ts caches these for dev/HMR; tests must isolate.
  delete (globalThis as unknown as { __db?: unknown }).__db;
  delete (globalThis as unknown as { __dbEdge?: unknown }).__dbEdge;
}

describe('db/client', () => {
  beforeEach(() => {
    vi.resetModules();
    clearTestEnv();
    clearGlobalDbSingletons();
  });

  afterEach(() => {
    restoreEnv();
    clearGlobalDbSingletons();
  });

  it('throws on invalid DB_PROVIDER at import time', async () => {
    process.env.DB_PROVIDER = 'postgrse';
    await expect(import('@/db/client')).rejects.toThrow(/DB_PROVIDER="postgrse"/);
  }, 15000);

  it('does not connect at import time (postgres default) when DATABASE_URL is missing', async () => {
    await expect(import('@/db/client')).resolves.toBeTruthy();
  });

  it('fails fast on first access when DB_PROVIDER=postgres and DATABASE_URL is missing', async () => {
    process.env.DB_PROVIDER = 'postgres';
    const { db } = await import('@/db/client');

    expect(() => db.query).toThrow(/DATABASE_URL is required/);
  });

  it('throws descriptive error for sqlite provider (not available in bundled builds)', async () => {
    process.env.DB_PROVIDER = 'sqlite';

    const { db, dbEdge } = await import('@/db/client');

    expect(() => db.select).toThrow(/SQLite provider not available in bundled builds/);
    expect(() => dbEdge.select).toThrow(/SQLite provider is not supported in Edge runtime/);
  });

  it('guards D1 provider behind explicit Worker binding', async () => {
    process.env.DB_PROVIDER = 'd1';
    const { db, dbEdge } = await import('@/db/client');

    expect(() => db.query).toThrow(/D1 provider cannot be initialized/);
    expect(() => dbEdge.query).toThrow(/D1 edge db/);
  });
});
