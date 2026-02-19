import { expect, test } from '@playwright/test';
import { signUpAndReachWorkspaces } from './helpers/auth';

test.describe('Screens Smoke', () => {
  test('public + core protected screens render in pt-BR (route-level smoke)', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile-safari',
      'Mobile Safari auth bootstrap is unstable in full-matrix run; covered in other engines.'
    );

    // Keep this smoke active on desktop + Android projects.
    // Mobile Safari has auth bootstrap instability in long matrix runs and is covered by focused tests.

    const baseURL = testInfo.project.use.baseURL as string;
    await page.context().addCookies([
      {
        name: 'shipped_locale',
        value: 'pt-BR',
        url: baseURL,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    // Public screens.
    await page.goto('/pt-br', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(
      page.getByRole('link', { name: /criar meu planejamento agora|ir para o planner/i }).first()
    ).toBeVisible();

    await page.goto('/pt-br/pricing', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(
      page.getByRole('heading', { name: /(pricing|precos|pre\u00e7os)/i })
    ).toBeVisible();

    await page.goto('/pt-br/blog', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();

    // Follow the first post link to validate dynamic blog pages render.
    const firstPost = page
      .locator('a[href^="/pt-br/blog/"]:not([href^="/pt-br/blog/tag/"]):not([href="/pt-br/blog"])')
      .first();
    if ((await firstPost.count()) > 0) {
      await firstPost.click({ timeout: 15_000 });
      await expect(page.locator('article')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    }

    await page.goto('/pt-br/terms', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByRole('heading', { name: /termos/i })).toBeVisible();

    await page.goto('/pt-br/privacy', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByRole('heading', { name: /privacidade/i })).toBeVisible();

    await page.goto('/pt-br/security', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(
      page.getByRole('heading', { level: 1, name: /pol[ií]tica de seguran[cç]a|security policy/i })
    ).toBeVisible();

    // Auth screens (unauthenticated).
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByRole('heading', { name: /entre na sua conta/i })).toBeVisible();

    await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByRole('heading', { name: /redefin/i })).toBeVisible();

    // Protected screens (authenticated).
    await signUpAndReachWorkspaces(page, { seed: testInfo.testId });

    const protectedRoutes = [
      '/dashboard',
      '/dashboard/workspaces',
      '/dashboard/workspaces/new',
      '/dashboard/team',
      '/dashboard/billing',
      '/dashboard/analytics',
      '/dashboard/notifications',
      '/dashboard/settings',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
      await expect(page.locator('main')).toBeVisible();
    }
  });
});
