import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

// Some runners set NO_COLOR while Playwright forces colors; this combination emits noisy warnings.
// Drop NO_COLOR for E2E to keep logs clean and deterministic.
delete process.env.NO_COLOR;

// Avoid accidental reuse of an unrelated dev server running on :3000.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100';
const { port } = new URL(baseURL);
const serverPort = port || '3000';

const isExternal = process.env.PW_EXTERNAL === '1';

const dbProvider = process.env.DB_PROVIDER ?? 'sqlite';
const sqlitePathRaw = process.env.SQLITE_PATH ?? '.next-playwright/e2e.db';
// `pnpm start` runs the standalone server from `.next/standalone` (different cwd),
// so SQLite must be an absolute path to be stable across build/start.
const sqlitePath = path.isAbsolute(sqlitePathRaw)
  ? sqlitePathRaw
  : path.join(process.cwd(), sqlitePathRaw);

function getWebServerEnv(): Record<string, string> {
  // Carry through the parent environment for CI compatibility, then override
  // the few values we need deterministically.
  const env: Record<string, string> = { ...(process.env as Record<string, string>) };
  delete env.NO_COLOR;

  // Signal to the app that it's running under Playwright E2E so we can make
  // test-only adjustments (for example, disabling auth rate limiting).
  env.PLAYWRIGHT_E2E = '1';

  // Isolate Playwright builds from any concurrently running `pnpm dev` using `.next/`.
  // This avoids `.next/lock` contention and keeps E2E deterministic.
  // Keep it stable across runs to avoid `tsconfig.json` churn (Next may add distDir-specific
  // includes for generated types).
  env.NEXT_DIST_DIR ||= path.join('.next-playwright', 'dist');

  env.PORT = serverPort;
  env.DB_PROVIDER = dbProvider;
  // Production start requires an explicit canonical origin for Better Auth.
  env.NEXT_PUBLIC_APP_URL ||= baseURL;
  env.BETTER_AUTH_BASE_URL ||= env.BETTER_AUTH_URL || baseURL;
  env.BETTER_AUTH_URL ||= env.BETTER_AUTH_BASE_URL;
  // Make E2E self-contained: the auth secret must exist for session cookies/signing.
  env.BETTER_AUTH_SECRET ||= 'e2e-secret-please-override-this-in-prod-32chars';

  if (dbProvider === 'sqlite') {
    env.SQLITE_PATH = sqlitePath;
    return env;
  }

  if (dbProvider === 'postgres') {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        'Playwright E2E requires DATABASE_URL when DB_PROVIDER=postgres. ' +
          'Either set DATABASE_URL, or omit DB_PROVIDER to use sqlite by default.'
      );
    }
    env.DATABASE_URL = url;
    return env;
  }

  throw new Error(
    `Playwright E2E does not support DB_PROVIDER=${dbProvider}. Use sqlite or postgres.`
  );
}

function getDbSetupCommand(): string {
  if (dbProvider === 'sqlite') {
    // E2E should be deterministic and not depend on external services by default.
    return (
      `node -e "const fs=require('fs');` +
      `fs.mkdirSync('.next-playwright',{recursive:true});` +
      `fs.rmSync(process.env.SQLITE_PATH,{force:true});"` +
      ` && pnpm db:push:sqlite && pnpm db:seed`
    );
  }
  // For postgres runs, rely on the configured DATABASE_URL.
  return `pnpm db:push:pg && pnpm db:seed`;
}

// Default E2E should be deterministic without requiring every browser engine
// to be installed locally. Opt-in to full cross-browser via PW_FULL=1.
const isFullMatrix = process.env.PW_FULL === '1';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // SQLite writes can be flaky under parallel test load (single file DB + concurrent signups).
  // Keep default E2E deterministic by running with 1 worker on sqlite; opt into parallelism by using postgres.
  workers: process.env.CI ? 1 : dbProvider === 'sqlite' ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    ...(isFullMatrix
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
          { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
        ]
      : []),
  ],
  // When targeting an external environment (preview/staging/prod), do not start a local webServer
  // or mutate app runtime via env (e.g., PLAYWRIGHT_E2E). This keeps the run "black box".
  webServer: isExternal
    ? undefined
    : {
        // Run against a production build for deterministic results (no dev overlay, no HMR races).
        command: `${getDbSetupCommand()} && pnpm build && pnpm start`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 240 * 1000,
        env: getWebServerEnv(),
      },
});
