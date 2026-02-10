import { test, expect } from '@playwright/test';

test.describe('security.txt (RFC 9116) @dast', () => {
  test('exposes a non-placeholder security.txt with required fields @dast', async ({
    request,
  }, testInfo) => {
    const res = await request.get('/.well-known/security.txt');
    expect(res.status()).toBe(200);

    const h = res.headers();
    expect(h['content-type']).toContain('text/plain');

    const body = await res.text();
    expect(body).toContain('Contact:');
    expect(body).toContain('Policy:');
    expect(body).toContain('Canonical:');
    expect(body).toContain('Expires:');

    // Regression guard: never ship template placeholders.
    expect(body).not.toContain('security@localhost');
    expect(body).not.toContain('example.com');

    const canonicalLine = body
      .split('\n')
      .find((line) => line.toLowerCase().startsWith('canonical:'));
    expect(canonicalLine).toBeTruthy();

    const canonical = (canonicalLine ?? '').split(':').slice(1).join(':').trim();
    expect(canonical.endsWith('/.well-known/security.txt')).toBe(true);

    // If baseURL is known, assert the canonical origin matches it.
    const baseURL =
      (testInfo.project.use.baseURL as string | undefined) ??
      (process.env.PLAYWRIGHT_BASE_URL ?? '').trim();
    try {
      const origin = new URL(baseURL).origin;
      expect(canonical.startsWith(origin)).toBe(true);
    } catch {
      // Ignore: baseURL not parseable in some environments.
    }

    const expiresLine = body.split('\n').find((line) => line.toLowerCase().startsWith('expires:'));
    expect(expiresLine).toBeTruthy();
    const expiresRaw = (expiresLine ?? '').split(':').slice(1).join(':').trim();
    const expires = new Date(expiresRaw);
    expect(Number.isNaN(expires.getTime())).toBe(false);
    expect(expires.getTime()).toBeGreaterThan(Date.now());
  });
});
