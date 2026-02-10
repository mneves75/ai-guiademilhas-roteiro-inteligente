import { test, expect } from '@playwright/test';
import { signUpAndReachWorkspaces } from './helpers/auth';

test.describe('Security Headers (DAST-lite) @dast', () => {
  test('public routes expose baseline security headers @dast', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);

    const h = res.headers();
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(h['cross-origin-opener-policy']).toBe('same-origin-allow-popups');
    expect(h['origin-agent-cluster']).toBe('?1');
    expect(h['x-permitted-cross-domain-policies']).toBe('none');
    expect(h['permissions-policy']).toContain('camera=()');
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(h['x-request-id']).toBeTruthy();

    const baseUrl = (process.env.PLAYWRIGHT_BASE_URL ?? '').trim();
    if (baseUrl.startsWith('https://')) {
      expect(h['strict-transport-security']).toContain('max-age=');
    }
  });

  test('api routes are no-store by default @dast', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    expect(res.headers()['cache-control']).toContain('no-store');
  });

  test('protected pages are no-store and use a strict nonce CSP @dast', async ({
    page,
  }, testInfo) => {
    if (process.env.PW_ALLOW_STATEFUL_DAST) {
      await signUpAndReachWorkspaces(page, { seed: testInfo.testId });

      const res = await page.request.get('/dashboard/workspaces');
      expect(res.status()).toBe(200);
      const h = res.headers();
      expect(h['cache-control']).toContain('no-store');

      const csp = h['content-security-policy'];
      expect(csp).toContain('strict-dynamic');
      expect(csp).toMatch(/nonce-[^'";\\s]+/);
      return;
    }

    // Stateless fallback: the app should redirect unauthenticated users, and the redirect response
    // should still be non-cacheable (defense-in-depth for intermediaries).
    const res = await page.request.get('/dashboard/workspaces', { maxRedirects: 0 });
    expect(res.status()).toBeGreaterThanOrEqual(300);
    expect(res.status()).toBeLessThan(400);
    expect(res.headers()['location']).toContain('/login');
    expect(res.headers()['cache-control']).toContain('no-store');
  });
});
