import { test, expect } from '@playwright/test';
import { signUpAndReachWorkspaces } from './helpers/auth';

test.describe('Protected Routes', () => {
  test('should allow accessing /dashboard/workspaces after signup (real auth flow)', async ({
    page,
  }, testInfo) => {
    await signUpAndReachWorkspaces(page, { seed: testInfo.testId });
  });

  test('dashboard renders pt-BR when locale cookie is set', async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL as string;
    const { hostname } = new URL(baseURL);
    await page.context().addCookies([
      {
        name: 'shipped_locale',
        value: 'pt-BR',
        domain: hostname,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    // Unauthenticated: should still redirect, but UI is server-rendered from the cookie.
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByRole('heading', { name: /entre na sua conta/i })).toBeVisible();
  });

  test('should redirect unauthenticated users to /login', async ({ page }) => {
    await page.goto('/dashboard/workspaces');
    await expect(page).toHaveURL(/\/login/);
  });
});
