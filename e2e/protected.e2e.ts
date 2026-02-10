import { test, expect } from '@playwright/test';
import { signUpAndReachWorkspaces } from './helpers/auth';

test.describe('Protected Routes', () => {
  test('should allow accessing /dashboard/workspaces after signup (real auth flow)', async ({
    page,
  }, testInfo) => {
    await signUpAndReachWorkspaces(page, { seed: testInfo.testId });
  });

  test('should redirect unauthenticated users to /login', async ({ page }) => {
    await page.goto('/dashboard/workspaces');
    await expect(page).toHaveURL(/\/login/);
  });
});
