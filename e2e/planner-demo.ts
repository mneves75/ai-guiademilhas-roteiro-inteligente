/**
 * Demo script: opens a headed browser, signs up, fills the planner,
 * generates a real report, then pauses so you can interact with it.
 *
 * Usage: pnpm exec playwright test e2e/planner-demo.ts --project chromium --headed
 */
import { expect, test, type Page } from '@playwright/test';
import { signUpAndReachWorkspaces } from './helpers/auth';

async function selectOption(page: Page, triggerId: string, optionPattern: RegExp) {
  await page.locator(triggerId).click();
  await page.locator('[role="listbox"]').waitFor({ state: 'visible' });
  await page.getByRole('option', { name: optionPattern }).click();
}

test('demo: planner com relatório real — pause para visualizar', async ({ page }, testInfo) => {
  const baseURL = testInfo.project.use.baseURL as string;
  await page
    .context()
    .addCookies([
      { name: 'shipped_locale', value: 'pt-BR', url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

  await signUpAndReachWorkspaces(page, {
    seed: `demo-planner-${Date.now()}`,
    callbackUrl: '/planner',
  });

  await expect(page).toHaveURL(/\/planner/);

  // Preenche todos os campos
  await page.locator('#data_ida').fill('2026-09-10');
  await page.locator('#data_volta').fill('2026-09-20');
  await page.locator('#flex_dias').fill('3');
  await page.locator('#origens').fill('GRU');
  await page.locator('#destinos').fill('LIS, MAD');
  await page.locator('#num_adultos').fill('2');
  await page.locator('#num_chd').fill('1');
  await page.locator('#num_inf').fill('0');
  await page.locator('#idades_chd_inf').fill('8');
  await page.locator('#programas_milhas').fill('Smiles, Latam Pass');
  await page.locator('#programas_bancos').fill('Itaú, Bradesco');
  await page.locator('#vistos_existentes').fill('Schengen');
  await page.locator('#orcamento_brl').fill('5000');
  await page.locator('#bairros_pref').fill('Alfama, Malasaña');
  await page.locator('#perfil').fill('Gastronomia, história');
  await page.locator('#restricoes').fill('Evitar conexões longas (>4h)');

  await selectOption(page, '#preferencia_voo', /somente diretos|direct only/i);
  await selectOption(page, '#horarios_voo', /manhã|morning/i);
  await selectOption(page, '#bagagem', /^mão$|carry-on only/i);
  await selectOption(page, '#tolerancia_risco', /média|medium/i);
  await selectOption(page, '#hospedagem_padrao', /4 estrelas|4-star/i);

  // Gera o relatório (API real)
  await page.getByRole('button', { name: /gerar relat[oó]rio|generate report/i }).click();

  // Espera o relatório aparecer
  await expect(
    page.getByRole('heading', { level: 3, name: /plano|strategy|report|emiss/i })
  ).toBeVisible({ timeout: 30_000 });

  // PAUSA: browser fica aberto para você interagir
  await page.pause();
});
