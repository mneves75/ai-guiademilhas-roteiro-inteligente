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
  const escapedCallback = callbackUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const callbackPattern = new RegExp(`${escapedCallback}(?:[?#]|$)`);

  async function waitForCallbackNavigation(timeoutMs: number): Promise<boolean> {
    try {
      await page.waitForURL(callbackPattern, { timeout: timeoutMs });
      return true;
    } catch {
      return false;
    }
  }

  async function navigateDirectlyToCallback(): Promise<boolean> {
    await page.goto(callbackUrl, { waitUntil: 'domcontentloaded' });
    return callbackPattern.test(page.url());
  }

  async function signInFallback(): Promise<boolean> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await page.goto(`/login?callbackUrl=${callbackParam}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('form[data-testid="login-form"]')).toBeVisible();
      await page.getByLabel(/email address|email/i).fill(email);
      await page.getByLabel(/^(password|senha)$/i).fill(password);
      const signInButton = page.getByRole('button', { name: /sign in|entrar/i });
      try {
        await Promise.all([
          page.waitForURL(callbackPattern, { timeout: 15_000 }),
          signInButton.click(),
        ]);
        return true;
      } catch {
        if (attempt === 2) return false;
        if (page.isClosed()) return false;
        // Mobile Safari can lag after account creation; retry login deterministically.
        try {
          await page.waitForTimeout(500);
        } catch {
          return false;
        }
      }
    }
    return false;
  }

  await page.goto(`/signup?callbackUrl=${callbackParam}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('form[data-testid="signup-form"]')).toBeVisible();

  // Ensure the client component is hydrated before interacting; otherwise some engines may
  // fall back to a native form submit before React attaches handlers.
  const submit = page.getByRole('button', { name: /create account|criar conta/i });
  await expect(submit).toBeEnabled();

  await page.getByLabel(/full name|nome completo/i).fill(name);
  await page.getByLabel(/email address|email/i).fill(email);
  await page.getByLabel(/^(password|senha)$/i).fill(password);

  let navigated = false;
  try {
    await Promise.all([page.waitForURL(callbackPattern, { timeout: 15_000 }), submit.click()]);
    navigated = true;
  } catch {
    navigated = await waitForCallbackNavigation(500);
  }

  if (!navigated) {
    navigated = await navigateDirectlyToCallback();
  }

  if (!navigated) {
    // In CI, signup can occasionally not redirect despite account creation.
    // Fallback to sign-in with the same credentials to keep the auth flow deterministic.
    navigated = await signInFallback();
  }

  if (!navigated) {
    throw new Error(
      `auth_e2e_navigation_failed: expected callback "${callbackUrl}", got "${page.url()}"`
    );
  }

  if (callbackUrl.startsWith('/dashboard/workspaces')) {
    await expect(
      page.getByRole('heading', { level: 1, name: 'Workspaces', exact: true })
    ).toBeVisible();
  }

  return { email, password };
}
