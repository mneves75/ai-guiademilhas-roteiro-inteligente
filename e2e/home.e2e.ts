import { test, expect, type Page } from '@playwright/test';

async function gotoPage(page: Page, url: string) {
  // `waitUntil: 'load'` can be flaky across engines when some subresources hang.
  // For E2E we care that the DOM is ready and the critical UI is present.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
      return;
    } catch (err) {
      if (attempt === 1) throw err;
      // Best-effort retry for transient navigation hangs seen in some engines.
      await page.waitForTimeout(250);
    }
  }
}

test.describe('Home Page', () => {
  test('should redirect root to pt-BR canonical home', async ({ page }) => {
    await gotoPage(page, '/');
    await expect(page).toHaveURL(/\/pt-br\/?$/);
  });

  test('should load the home page', async ({ page }) => {
    await gotoPage(page, '/en');
    await expect(page).toHaveTitle(/Miles Guide|Guia de Milhas/);
  });

  test('should have navigation links', async ({ page }) => {
    await gotoPage(page, '/en');

    // Check for main navigation elements
    const primaryNav = page.getByRole('navigation', { name: 'Primary' });
    const loginLink = primaryNav.locator('a[href^="/login"]:visible').first();
    await expect(loginLink).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    await gotoPage(page, '/en');

    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should keep planner callback in unauthenticated CTAs', async ({ page }) => {
    await gotoPage(page, '/pt-br');

    const primaryCta = page.getByRole('link', { name: /criar meu planejamento agora/i }).first();
    await expect(primaryCta).toHaveAttribute('href', /\/signup\?callbackUrl=%2Fplanner/);
    await expect(primaryCta).toHaveAttribute('href', /source=landing_planner/);

    const loginCta = page
      .getByRole('navigation', { name: 'Primary' })
      .locator('a[href^="/login"]')
      .first();
    await expect(loginCta).toHaveAttribute('href', /\/login\?callbackUrl=%2Fplanner/);
    await expect(loginCta).toHaveAttribute('href', /source=landing_planner/);
  });
});

test.describe('Blog Page', () => {
  test('should load the blog page', async ({ page }) => {
    await gotoPage(page, '/en/blog');
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
  });

  test('should keep planner callback in blog sign-in CTA', async ({ page }) => {
    await gotoPage(page, '/en/blog');
    const signInLink = page.getByRole('link', { name: /sign in|entrar/i }).first();
    await expect(signInLink).toHaveAttribute('href', /\/login\?callbackUrl=%2Fplanner/);
  });

  test('should display blog posts', async ({ page }) => {
    await gotoPage(page, '/en/blog');

    // Should have at least one blog post card or empty state
    const content = page.locator('main');
    await expect(content).toBeVisible();
  });

  test('should navigate to a blog post', async ({ page }, testInfo) => {
    await gotoPage(page, '/en/blog');
    const isMobile = testInfo.project.name.includes('mobile');

    // Click on a blog post link if available
    const postLink = page.locator('main a[href^="/en/blog/"]:not([href^="/en/blog/tag/"])').first();
    if (await postLink.isVisible()) {
      await postLink.scrollIntoViewIfNeeded();
      const target = postLink.locator('h2, h3, [data-testid="post-title"]').first();
      const clickable = (await target.count()) > 0 ? target : postLink;

      if (isMobile) await clickable.tap({ timeout: 15_000 });
      else await clickable.click({ timeout: 15_000, force: true });

      await expect(page).toHaveURL(/\/en\/blog\//);
      await expect(page.locator('article')).toBeVisible();
    }
  });
});

test.describe('Authentication Pages', () => {
  test('should load the login page', async ({ page }) => {
    await gotoPage(page, '/login');
    await expect(
      page.getByRole('heading', { name: /sign in|login|welcome|entre na sua conta|entrar/i })
    ).toBeVisible();
  });

  test('should load the signup page', async ({ page }) => {
    await gotoPage(page, '/signup');
    await expect(
      page.getByRole('heading', { name: /sign up|register|create|crie sua conta|criar conta/i })
    ).toBeVisible();
  });

  test('should load the forgot password page', async ({ page }) => {
    await gotoPage(page, '/forgot-password');
    await expect(page.getByRole('heading', { name: /reset|redefinir/i })).toBeVisible();
  });

  test('should load the reset password page', async ({ page }) => {
    await gotoPage(page, '/reset-password');
    await expect(page.getByRole('heading', { name: /password|senha/i })).toBeVisible();
  });

  test('should have form inputs on login page', async ({ page }) => {
    await gotoPage(page, '/login');

    // Login page also contains a magic-link email input; select the primary login input explicitly.
    const emailInput = page.locator('#email');
    const passwordInput = page.getByLabel(/password|senha/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should preserve planner callback + source between login and signup links', async ({
    page,
  }) => {
    await gotoPage(page, '/login?callbackUrl=%2Fplanner&source=landing_planner');

    const createAccountLink = page.locator('a[href^="/signup"]').first();
    await expect(createAccountLink).toHaveAttribute('href', /\/signup\?callbackUrl=%2Fplanner/);
    await expect(createAccountLink).toHaveAttribute('href', /source=landing_planner/);

    await gotoPage(page, '/signup?callbackUrl=%2Fplanner&source=landing_planner');
    const signInLink = page.locator('a[href^="/login"]').first();
    await expect(signInLink).toHaveAttribute('href', /\/login\?callbackUrl=%2Fplanner/);
    await expect(signInLink).toHaveAttribute('href', /source=landing_planner/);
  });
});

test.describe('Pricing', () => {
  test('should load the pricing page', async ({ page }) => {
    await gotoPage(page, '/en/pricing');
    await expect(
      page.getByRole('heading', { name: /(pricing|precos|pre\u00e7os)/i })
    ).toBeVisible();
  });

  test('should keep planner callback in pricing sign-up ctas', async ({ page }) => {
    await gotoPage(page, '/en/pricing');
    const signupLinks = page.locator('a[href^="/signup"]');
    const count = await signupLinks.count();

    for (let i = 0; i < count; i += 1) {
      await expect(signupLinks.nth(i)).toHaveAttribute('href', /\/signup\?callbackUrl=%2Fplanner/);
      await expect(signupLinks.nth(i)).toHaveAttribute('href', /source=landing_planner/);
    }
  });

  test('should keep source in pricing manage-billing login cta', async ({ page }) => {
    await gotoPage(page, '/en/pricing');
    const manageBillingLink = page.getByRole('link', { name: /manage billing/i }).first();
    await expect(manageBillingLink).toHaveAttribute(
      'href',
      /\/login\?callbackUrl=%2Fdashboard%2Fbilling/
    );
    await expect(manageBillingLink).toHaveAttribute('href', /source=landing_planner/);
  });
});

test.describe('SEO', () => {
  test('should have proper meta tags on home page', async ({ page }) => {
    await gotoPage(page, '/en');

    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);

    // Check OpenGraph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /.+/);

    // Canonical must match the locale-stable public URL.
    const canonical = page.locator('link[rel="canonical"]').first();
    await expect(canonical).toHaveAttribute('href', /\/en\/?$/);

    // hreflang should be present for pages that exist in both locales.
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="en-US"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="pt-BR"]')).toHaveCount(1);

    // RSS autodiscovery should exist (from root metadata alternates)
    const rssAlternate = page.locator('link[rel="alternate"][type="application/rss+xml"]');
    await expect(rssAlternate).toHaveCount(1);
  });

  test('should expose FAQPage JSON-LD with at least three questions', async ({ page }) => {
    await gotoPage(page, '/en');

    const faq = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const script of scripts) {
        const raw = script.textContent ?? '';
        try {
          const parsed = JSON.parse(raw) as {
            ['@type']?: string;
            mainEntity?: Array<{ ['@type']?: string; name?: string }>;
          };
          if (parsed['@type'] === 'FAQPage') return parsed;
        } catch {
          // Ignore malformed blocks and continue scanning.
        }
      }
      return null;
    });

    expect(faq).not.toBeNull();
    expect(Array.isArray(faq?.mainEntity)).toBe(true);
    expect((faq?.mainEntity ?? []).length).toBeGreaterThanOrEqual(3);
    expect((faq?.mainEntity ?? []).every((q) => q?.['@type'] === 'Question')).toBe(true);
  });

  test('should expose Service JSON-LD on landing', async ({ page }) => {
    await gotoPage(page, '/pt-br');

    const service = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const script of scripts) {
        const raw = script.textContent ?? '';
        try {
          const parsed = JSON.parse(raw) as { ['@type']?: string; offers?: { ['@type']?: string } };
          if (parsed['@type'] === 'Service') return parsed;
        } catch {
          // Ignore malformed blocks and continue scanning.
        }
      }
      return null;
    });

    expect(service).not.toBeNull();
    expect(service?.offers?.['@type']).toBe('Offer');
  });

  test('should expose OfferCatalog JSON-LD on pricing page', async ({ page }) => {
    await gotoPage(page, '/en/pricing');

    const catalog = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const script of scripts) {
        const raw = script.textContent ?? '';
        try {
          const parsed = JSON.parse(raw) as {
            ['@type']?: string;
            itemListElement?: unknown[];
          };
          if (parsed['@type'] === 'OfferCatalog') return parsed;
        } catch {
          // Ignore malformed blocks and continue scanning.
        }
      }
      return null;
    });

    expect(catalog).not.toBeNull();
    expect(Array.isArray(catalog?.itemListElement)).toBe(true);
    expect((catalog?.itemListElement ?? []).length).toBeGreaterThanOrEqual(1);
  });

  test('should render locale-stable canonicals in pt-BR', async ({ page }) => {
    await gotoPage(page, '/pt-br');

    const canonical = page.locator('link[rel="canonical"]').first();
    await expect(canonical).toHaveAttribute('href', /\/pt-br\/?$/);
  });

  test('should have robots.txt', async ({ request }) => {
    // robots.txt and sitemap.xml are not HTML documents; use an HTTP request instead of page navigation
    // to avoid `waitUntil: 'load'` semantics and reduce cross-browser flakiness.
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('Sitemap:');
  });

  test('should have sitemap.xml', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const body = await response.text();
    // Should not advertise auth surfaces in the sitemap.
    expect(body).not.toContain('/login');
    expect(body).not.toContain('/signup');
  });

  test('should have rss.xml', async ({ request }) => {
    const response = await request.get('/rss.xml');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/rss+xml');
    const body = await response.text();
    expect(body).toContain('<rss');
    expect(body).toContain('<channel>');
    expect(body).toContain('<item>');
  });

  test('sensitive routes should send X-Robots-Tag noindex', async ({ request }) => {
    const response = await request.get('/dashboard', { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers()['x-robots-tag']).toMatch(/noindex/i);
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy on home page', async ({ page }) => {
    await gotoPage(page, '/en');

    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await gotoPage(page, '/en');

    // Navigation should be accessible
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await gotoPage(page, '/en');
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const activeTag = await page.evaluate(() => document.activeElement?.tagName ?? null);
    expect(activeTag).not.toBeNull();
    expect(activeTag).not.toBe('BODY');
  });
});
