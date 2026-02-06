import { defineConfig, devices } from '@playwright/test';

// Avoid accidental reuse of an unrelated dev server running on :3000.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100';
const { port } = new URL(baseURL);
const serverPort = port || '3000';

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
    command: `NEXT_DIST_DIR=.next-playwright PORT=${serverPort} pnpm build && NEXT_DIST_DIR=.next-playwright PORT=${serverPort} pnpm start`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 240 * 1000,
  },
});
