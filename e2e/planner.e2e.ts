import { expect, test } from '@playwright/test';
import { signUpAndReachWorkspaces } from './helpers/auth';

test.describe('Planner', () => {
  test('generates planner report from dashboard form', async ({ page }, testInfo) => {
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

    await signUpAndReachWorkspaces(page, {
      seed: `${testInfo.testId}-planner`,
      callbackUrl: '/dashboard/planner',
    });

    await expect(page).toHaveURL(/\/dashboard\/planner/);
    await expect(
      page.getByRole('heading', { name: /planner de viagens com milhas|miles travel planner/i })
    ).toBeVisible();

    await page.getByLabel(/data de ida|departure date/i).fill('2026-09-10');
    await page.getByLabel(/data de volta|return date/i).fill('2026-09-20');
    await page.getByLabel(/origem|origin/i).fill('GRU');
    await page.getByLabel(/destinos candidatos|candidate destinations/i).fill('LIS, MAD');

    await page.getByRole('button', { name: /gerar relat[oó]rio|generate report/i }).click();

    await expect(
      page.getByRole('heading', {
        level: 3,
        name: /plano|strategy|report|emiss/i,
      })
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('ul.list-disc li').first()).toBeVisible();

    const fallbackNotice = page.locator('text=/modo resiliente|fallback mode/i');
    if ((await fallbackNotice.count()) > 0) {
      await expect(fallbackNotice.first()).toBeVisible();
    }
  });
});
