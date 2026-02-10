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
  test('should load the home page', async ({ page }) => {
    await gotoPage(page, '/en');
    await expect(page).toHaveTitle(/NextJS Bootstrapped Shipped/);
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
});

test.describe('Blog Page', () => {
  test('should load the blog page', async ({ page }) => {
    await gotoPage(page, '/en/blog');
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
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
    await expect(page.getByRole('heading', { name: /sign in|login|welcome/i })).toBeVisible();
  });

  test('should load the signup page', async ({ page }) => {
    await gotoPage(page, '/signup');
    await expect(page.getByRole('heading', { name: /sign up|register|create/i })).toBeVisible();
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
    const passwordInput = page.getByLabel(/password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });
});

test.describe('Pricing', () => {
  test('should load the pricing page', async ({ page }) => {
    await gotoPage(page, '/en/pricing');
    await expect(
      page.getByRole('heading', { name: /(pricing|precos|pre\u00e7os)/i })
    ).toBeVisible();
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

    // RSS autodiscovery should exist (from root metadata alternates)
    const rssAlternate = page.locator('link[rel="alternate"][type="application/rss+xml"]');
    await expect(rssAlternate).toHaveCount(1);
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
