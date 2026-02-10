import { expect, type Page } from '@playwright/test';

export function uniqueEmail(seed: string): string {
  const safeId = seed.replace(/[^a-z0-9_-]+/gi, '-').slice(0, 40);
  return `e2e-${safeId}-${Date.now()}@example.com`.toLowerCase();
}

export async function signUpAndReachWorkspaces(
  page: Page,
  {
    seed,
    callbackUrl = '/dashboard/workspaces',
    name = 'E2E User',
    password = 'TestPassword123!',
  }: {
    seed: string;
    callbackUrl?: string;
    name?: string;
    password?: string;
  }
): Promise<{ email: string; password: string }> {
  const email = uniqueEmail(seed);
  const callbackParam = encodeURIComponent(callbackUrl);

  await page.goto(`/signup?callbackUrl=${callbackParam}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('form[data-testid="signup-form"]')).toBeVisible();

  await page.getByLabel(/full name/i).fill(name);
  await page.getByLabel(/email address|email/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);

  await page.getByRole('button', { name: /create/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/workspaces/, { timeout: 15_000 });
  await expect(
    page.getByRole('heading', { level: 1, name: 'Workspaces', exact: true })
  ).toBeVisible();

  return { email, password };
}
