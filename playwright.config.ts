import { defineConfig, devices } from '@playwright/test';

// Avoid accidental reuse of an unrelated dev server running on :3000.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100';
const { port } = new URL(baseURL);
const serverPort = port || '3000';

const dbProvider = process.env.DB_PROVIDER ?? 'sqlite';
const sqlitePath = process.env.SQLITE_PATH ?? '.next-playwright/e2e.db';

function getWebServerEnv(): Record<string, string> {
  // Carry through the parent environment for CI compatibility, then override
  // the few values we need deterministically.
  const env: Record<string, string> = { ...(process.env as Record<string, string>) };

  env.PORT = serverPort;
  env.DB_PROVIDER = dbProvider;

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
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
  webServer: {
    // Run against a production build for deterministic results (no dev overlay, no HMR races).
    // Note: Next.js writes `next-env.d.ts` based on the active distDir; keeping the
    // default `.next` avoids `next-env.d.ts` churn when running E2E locally.
    command: `${getDbSetupCommand()} && pnpm build && pnpm start`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 240 * 1000,
    env: getWebServerEnv(),
  },
});
