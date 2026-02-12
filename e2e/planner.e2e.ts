import { expect, test, type Page } from '@playwright/test';
import { signUpAndReachWorkspaces, uniqueEmail } from './helpers/auth';

async function fillPlannerRequiredFields(page: Page) {
  await page.getByLabel(/data de ida|departure date/i).fill('2026-09-10');
  await page.getByLabel(/data de volta|return date/i).fill('2026-09-20');
  await page.getByLabel(/origem|origin/i).fill('GRU');
  await page.getByLabel(/destinos candidatos|candidate destinations/i).fill('LIS, MAD');
}

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
      callbackUrl: '/planner',
    });

    await expect(page).toHaveURL(/\/planner/);
    await expect(
      page.getByRole('heading', { name: /planner de viagens com milhas|miles travel planner/i })
    ).toBeVisible();

    await fillPlannerRequiredFields(page);

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

  test('preserves callback/source when entering planner from landing CTA', async ({
    page,
  }, testInfo) => {
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

    await page.goto('/pt-br', { waitUntil: 'domcontentloaded' });

    const heroCta = page.getByRole('link', { name: /criar meu planejamento agora/i }).first();
    await expect(heroCta).toHaveAttribute('href', /callbackUrl=%2Fplanner/);
    await expect(heroCta).toHaveAttribute('href', /source=landing_planner/);

    await heroCta.click();
    await expect(page).toHaveURL(/\/signup\?callbackUrl=%2Fplanner/);
    await expect(page).toHaveURL(/source=landing_planner/);

    const email = uniqueEmail(`${testInfo.testId}-landing-cta`);
    await page.getByLabel(/full name|nome completo/i).fill('E2E Landing User');
    await page.getByLabel(/email address|email/i).fill(email);
    await page.getByLabel(/^(password|senha)$/i).fill('TestPassword123!');

    await Promise.all([
      page.waitForURL(/\/planner(?:[?#]|$)/, { timeout: 15_000 }),
      page.getByRole('button', { name: /create account|criar conta/i }).click(),
    ]);
    await expect(page).toHaveURL(/\/planner/);
    await expect(
      page.getByRole('heading', { name: /planner de viagens com milhas|miles travel planner/i })
    ).toBeVisible();
  });

  test('shows retry hint when planner API responds with 429 problem+json', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile-safari',
      'Mobile Safari auth bootstrap is unstable in full-matrix run; covered in other engines.'
    );

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
      seed: `${testInfo.testId}-planner-rate-limit`,
      callbackUrl: '/planner',
    });
    await expect(page).toHaveURL(/\/planner/);

    await page.route('**/api/planner/generate', async (route) => {
      await route.fulfill({
        status: 429,
        headers: {
          'content-type': 'application/problem+json; charset=utf-8',
          'retry-after': '12',
          'x-request-id': 'req_e2e_rate_limit_001',
        },
        body: JSON.stringify({
          type: 'https://guiademilhas.app/problems/planner-rate-limit',
          title: 'Too Many Requests',
          status: 429,
          detail: 'Rate limit exceeded',
          instance: '/api/planner/generate',
          code: 'planner_rate_limited',
          retryAfterSeconds: 12,
          requestId: 'req_e2e_rate_limit_001',
        }),
      });
    });

    await fillPlannerRequiredFields(page);
    await page.getByRole('button', { name: /gerar relat[oó]rio|generate report/i }).click();
    await expect(page.getByText(/tente novamente em 12s|retry in 12s/i)).toBeVisible();
    await expect(page.getByText(/id de suporte|support id/i)).toBeVisible();
  });

  test('shows invalid server response when planner payload is malformed', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile-safari',
      'Mobile Safari auth bootstrap is unstable in full-matrix run; covered in other engines.'
    );

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
      seed: `${testInfo.testId}-planner-malformed`,
      callbackUrl: '/planner',
    });
    await expect(page).toHaveURL(/\/planner/);

    await page.route('**/api/planner/generate', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'x-request-id': 'req_e2e_malformed_001',
        },
        body: JSON.stringify({
          schemaVersion: '2026-02-11',
          generatedAt: new Date().toISOString(),
          mode: 'fallback',
          // Missing `report` on purpose.
        }),
      });
    });

    await fillPlannerRequiredFields(page);
    await page.getByRole('button', { name: /gerar relat[oó]rio|generate report/i }).click();
    await expect(
      page.getByText(/resposta inv[aá]lida do servidor|invalid server response/i)
    ).toBeVisible();
  });
});
