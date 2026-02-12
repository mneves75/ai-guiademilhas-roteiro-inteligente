import { expect, test, type Page } from '@playwright/test';
import { signUpAndReachWorkspaces, uniqueEmail } from './helpers/auth';

async function fillPlannerRequiredFields(page: Page) {
  await page.getByLabel(/data de ida|departure date/i).fill('2026-09-10');
  await page.getByLabel(/data de volta|return date/i).fill('2026-09-20');
  await page.getByLabel(/origem|origin/i).fill('GRU');
  await page.getByLabel(/destinos candidatos|candidate destinations/i).fill('LIS, MAD');
}

async function setPtBrLocale(page: Page, baseURL: string) {
  await page
    .context()
    .addCookies([
      { name: 'shipped_locale', value: 'pt-BR', url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);
}

async function selectOption(page: Page, triggerId: string, optionPattern: RegExp) {
  await page.locator(triggerId).click();
  await page.locator('[role="listbox"]').waitFor({ state: 'visible' });
  await page.getByRole('option', { name: optionPattern }).click();
}

async function fillPlannerAllFields(page: Page) {
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
}

const MOCK_REPORT = {
  schemaVersion: '2026-02-11',
  generatedAt: '2026-09-01T12:00:00.000Z',
  mode: 'ai' as const,
  report: {
    title: 'Plano de Emissão: GRU → LIS/MAD',
    summary:
      'Roteiro otimizado para 2 adultos e 1 criança, priorizando voos diretos pela manhã com Smiles e Latam Pass.',
    sections: [
      {
        title: 'Voos Recomendados',
        items: [
          'GRU → LIS: LATAM LA8084, direto, 10h15 — 65.000 milhas Latam Pass + R$380 taxas',
          'LIS → MAD: TAP TP1024, direto, 1h20 — 7.500 milhas TAP Miles&Go',
          'MAD → GRU: Iberia IB6825, direto, 11h40 — 60.000 milhas Smiles + R$420 taxas',
        ],
      },
      {
        title: 'Custo Total Estimado',
        items: [
          'Total milhas: 132.500 (Latam Pass) + 7.500 (TAP)',
          'Total taxas: R$800 por pessoa',
          'Orçamento dentro do limite de R$5.000/pessoa',
        ],
      },
      {
        title: 'Hospedagem Sugerida',
        items: [
          'Lisboa (Alfama): Hotel 4★ — média R$450/noite',
          'Madrid (Malasaña): Hotel 4★ — média R$380/noite',
        ],
      },
      {
        title: 'Riscos e Alternativas',
        items: [
          'Disponibilidade Smiles pode variar: reservar com 60+ dias',
          'Alternativa MAD: considerar Porto (OPO) se LIS esgotado',
        ],
      },
    ],
    assumptions: [
      'Preços de milhas baseados em tabela fixa Smiles/Latam Pass set/2026',
      'Disponibilidade sujeita a confirmação no momento da emissão',
    ],
  },
};

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

  test('fills all form fields and verifies complete report structure', async ({
    page,
  }, testInfo) => {
    await setPtBrLocale(page, testInfo.project.use.baseURL as string);

    await signUpAndReachWorkspaces(page, {
      seed: `${testInfo.testId}-planner-full`,
      callbackUrl: '/planner',
    });

    // Mock with small delay to make loading state observable
    await page.route('**/api/planner/generate', async (route) => {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      // Verify the payload carries the filled preferences
      const prefs = body.preferences as Record<string, unknown>;
      expect(prefs.data_ida).toBe('2026-09-10');
      expect(prefs.origens).toBe('GRU');
      expect(prefs.destinos).toBe('LIS, MAD');
      expect(prefs.num_adultos).toBe(2);
      expect(prefs.preferencia_voo).toBe('direto');
      expect(prefs.horarios_voo).toBe('manha');
      expect(prefs.bagagem).toBe('mao');
      expect(prefs.tolerancia_risco).toBe('media');
      expect(prefs.hospedagem_padrao).toBe('4');
      expect(prefs.restricoes).toBe('Evitar conexões longas (>4h)');

      await new Promise((r) => setTimeout(r, 300));
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(MOCK_REPORT),
      });
    });

    await fillPlannerAllFields(page);

    const submitBtn = page.getByRole('button', { name: /gerar relat[oó]rio|generate report/i });
    await submitBtn.click();

    // Loading state: button text changes while API is delayed
    await expect(
      page.getByRole('button', { name: /gerando relat|generating report/i })
    ).toBeVisible();

    // Wait for report card
    const reportTitle = page.getByRole('heading', { level: 3, name: MOCK_REPORT.report.title });
    await expect(reportTitle).toBeVisible({ timeout: 10_000 });

    // Summary
    await expect(page.getByText(MOCK_REPORT.report.summary)).toBeVisible();

    // All 4 section headings (h4)
    for (const section of MOCK_REPORT.report.sections) {
      await expect(page.getByRole('heading', { level: 4, name: section.title })).toBeVisible();
    }

    // Scope item count to the report card (second Card component on page)
    const reportCard = page
      .locator('[class*="card"]')
      .filter({ hasText: MOCK_REPORT.report.title });
    const totalItems = MOCK_REPORT.report.sections.reduce((sum, s) => sum + s.items.length, 0);
    await expect(reportCard.locator('ul.list-disc li')).toHaveCount(
      totalItems + MOCK_REPORT.report.assumptions.length
    );

    // Assumptions section — find by heading text, not CSS class
    await expect(
      page.getByRole('heading', { level: 4, name: /assun[çc][oõ]es|assumptions/i })
    ).toBeVisible();
    await expect(page.getByText(MOCK_REPORT.report.assumptions[0]!)).toBeVisible();

    // No fallback notice (mode === 'ai')
    await expect(page.getByText(/modo resiliente|fallback mode/i)).not.toBeVisible();

    // Reset button visible
    await expect(
      page.getByRole('button', { name: /criar novo relat|start a new report/i })
    ).toBeVisible();
  });

  test('reset button clears report and restores empty form', async ({ page }, testInfo) => {
    await setPtBrLocale(page, testInfo.project.use.baseURL as string);

    await signUpAndReachWorkspaces(page, {
      seed: `${testInfo.testId}-planner-reset`,
      callbackUrl: '/planner',
    });

    await page.route('**/api/planner/generate', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(MOCK_REPORT),
      });
    });

    await fillPlannerAllFields(page);
    await page.getByRole('button', { name: /gerar relat[oó]rio|generate report/i }).click();

    await expect(
      page.getByRole('heading', { level: 3, name: MOCK_REPORT.report.title })
    ).toBeVisible({ timeout: 10_000 });

    // Click reset
    await page.getByRole('button', { name: /criar novo relat|start a new report/i }).click();

    // Report disappears
    await expect(
      page.getByRole('heading', { level: 3, name: MOCK_REPORT.report.title })
    ).not.toBeVisible();

    // Text/date/number inputs reset to initial values
    await expect(page.locator('#data_ida')).toHaveValue('');
    await expect(page.locator('#data_volta')).toHaveValue('');
    await expect(page.locator('#origens')).toHaveValue('');
    await expect(page.locator('#destinos')).toHaveValue('');
    await expect(page.locator('#flex_dias')).toHaveValue('2');
    await expect(page.locator('#num_adultos')).toHaveValue('1');
    await expect(page.locator('#num_chd')).toHaveValue('0');
    await expect(page.locator('#num_inf')).toHaveValue('0');
    await expect(page.locator('#programas_milhas')).toHaveValue('');
    await expect(page.locator('#restricoes')).toHaveValue('');

    // Verify Select triggers show default text (not the values we selected)
    // The defaults from initialTravelPreferences are:
    //   preferencia_voo: 'indiferente', horarios_voo: 'qualquer', bagagem: '1_despachada'
    //   tolerancia_risco: 'baixa', hospedagem_padrao: 'indiferente'
    await expect(page.locator('#preferencia_voo')).toContainText(/indiferente|no preference/i);
    await expect(page.locator('#horarios_voo')).toContainText(/qualquer hora|any time/i);
    await expect(page.locator('#bagagem')).toContainText(/1 despachada|1 checked/i);
    await expect(page.locator('#tolerancia_risco')).toContainText(/baixa|low/i);
    await expect(page.locator('#hospedagem_padrao')).toContainText(/indiferente|no preference/i);

    // Submit button re-enabled with original label
    await expect(
      page.getByRole('button', { name: /gerar relat[oó]rio|generate report/i })
    ).toBeEnabled();
  });

  test('shows validation errors when submitting empty form', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile-safari',
      'Mobile Safari auth bootstrap is unstable in full-matrix run; covered in other engines.'
    );

    await setPtBrLocale(page, testInfo.project.use.baseURL as string);

    await signUpAndReachWorkspaces(page, {
      seed: `${testInfo.testId}-planner-validation`,
      callbackUrl: '/planner',
    });

    let apiCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/planner/generate')) apiCalled = true;
    });

    await page.getByRole('button', { name: /gerar relat[oó]rio|generate report/i }).click();

    // Verify error messages appear adjacent to each required empty field.
    // Schema requires: data_ida (regex), data_volta (regex), origens (min 2), destinos (min 2)
    // Each field renders a <p class="text-xs text-destructive"> sibling when invalid.
    const requiredFieldIds = ['data_ida', 'data_volta', 'origens', 'destinos'];
    for (const fieldId of requiredFieldIds) {
      const fieldContainer = page.locator(`#${fieldId}`).locator('..');
      await expect(fieldContainer.locator('p.text-destructive')).toBeVisible();
    }

    // Server error alert should NOT appear (validation blocks submission)
    await expect(
      page.locator('[role="alert"]').filter({ hasText: /erro|error|problema|problem/i })
    ).not.toBeVisible();

    // API was never called
    expect(apiCalled).toBe(false);
  });

  test('shows date order error when return is before departure', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile-safari',
      'Mobile Safari auth bootstrap is unstable in full-matrix run; covered in other engines.'
    );

    await setPtBrLocale(page, testInfo.project.use.baseURL as string);

    await signUpAndReachWorkspaces(page, {
      seed: `${testInfo.testId}-planner-date-order`,
      callbackUrl: '/planner',
    });

    await page.locator('#data_ida').fill('2026-09-20');
    await page.locator('#data_volta').fill('2026-09-10');
    await page.locator('#origens').fill('GRU');
    await page.locator('#destinos').fill('LIS, MAD');

    await page.getByRole('button', { name: /gerar relat[oó]rio|generate report/i }).click();

    await expect(
      page.getByText(/data de volta deve ser igual ou posterior|return date must be on or after/i)
    ).toBeVisible();
  });
});
