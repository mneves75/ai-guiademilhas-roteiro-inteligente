import { test, expect } from '@playwright/test';

test.describe('i18n', () => {
  test('switches to pt-BR and persists via cookie', async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name.includes('mobile');

    await page.goto('/en', { waitUntil: 'domcontentloaded' });

    const switcher = page.getByRole('combobox', { name: /Language|Idioma/ });
    await expect(switcher).toBeEnabled();
    if (isMobile) await switcher.tap();
    else await switcher.click({ force: true });

    const optionByRole = page.getByRole('option', { name: 'Português (Brasil)' });
    const optionByAttr = page
      .locator('[role="option"]')
      .filter({ hasText: 'Português (Brasil)' })
      .first();
    const option = (await optionByRole.count()) > 0 ? optionByRole : optionByAttr;
    await expect(option).toBeVisible({ timeout: 10_000 });
    if (isMobile) await option.tap();
    else await option.click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page).toHaveURL(/\/pt-br(?:$|\/)/);
    await expect(page.getByRole('link', { name: 'Começar a construir' })).toBeVisible();

    // Cross-screen sanity: server-rendered pages should pick up locale from the cookie.
    await page.goto('/pt-br/pricing', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(
      page.getByRole('heading', { name: /(pricing|precos|pre\u00e7os)/i })
    ).toBeVisible();

    await page.goto('/pt-br/blog', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
  });
});
