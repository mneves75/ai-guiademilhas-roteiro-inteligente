import { test, expect } from '@playwright/test';

test.describe('i18n', () => {
  test('switches to pt-BR and persists via cookie', async ({ page }) => {
    await page.goto('/');

    const switcher = page.getByRole('combobox', { name: /Language|Idioma/ });
    await switcher.click();
    await page.getByRole('option', { name: 'Português (Brasil)' }).click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByRole('link', { name: 'Começar a construir' })).toBeVisible();

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByRole('link', { name: 'Começar a construir' })).toBeVisible();
  });
});
