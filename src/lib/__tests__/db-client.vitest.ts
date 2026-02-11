import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

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
  });

  it('does not connect at import time (postgres default) when DATABASE_URL is missing', async () => {
    await expect(import('@/db/client')).resolves.toBeTruthy();
  });

  it('fails fast on first access when DB_PROVIDER=postgres and DATABASE_URL is missing', async () => {
    process.env.DB_PROVIDER = 'postgres';
    const { db } = await import('@/db/client');

    expect(() => db.query).toThrow(/DATABASE_URL is required/);
  });

  it('initializes sqlite on first access, but refuses sqlite in edge client', async () => {
    process.env.DB_PROVIDER = 'sqlite';

    const dir = mkdtempSync(join(tmpdir(), 'db-seed-'));
    const sqlitePath = join(dir, 'app.db');
    process.env.SQLITE_PATH = sqlitePath;

    try {
      const { db, dbEdge } = await import('@/db/client');

      expect(typeof db.select).toBe('function');
      expect(() => dbEdge.select).toThrow(/SQLite provider is not supported in Edge runtime/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('guards D1 provider behind explicit Worker binding', async () => {
    process.env.DB_PROVIDER = 'd1';
    const { db, dbEdge } = await import('@/db/client');

    expect(() => db.query).toThrow(/D1 provider cannot be initialized/);
    expect(() => dbEdge.query).toThrow(/D1 edge db/);
  });
});
