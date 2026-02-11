import { describe, expect, it } from 'vitest';
import { validateProductionConfig } from '@/lib/security/prod-config';

describe('validateProductionConfig', () => {
  it('passes outside production', () => {
    expect(validateProductionConfig({ NODE_ENV: 'development' })).toEqual({ ok: true });
  });

  it('passes in production for local origins even without security contact', () => {
    expect(
      validateProductionConfig({
        NODE_ENV: 'production',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      })
    ).toEqual({
      ok: true,
    });
  });

  it('fails in production for public http origins', () => {
    const res = validateProductionConfig({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'http://example.com',
      SECURITY_CONTACT_EMAIL: 'security@example.com',
    });
    expect(res.ok).toBe(false);
  });

  it('fails in production for public origins without SECURITY_CONTACT_*', () => {
    const res = validateProductionConfig({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'https://example.com',
    });
    expect(res.ok).toBe(false);
  });

  it('passes in production for public https origins with SECURITY_CONTACT_EMAIL', () => {
    expect(
      validateProductionConfig({
        NODE_ENV: 'production',
        NEXT_PUBLIC_APP_URL: 'https://example.com',
        SECURITY_CONTACT_EMAIL: 'security@example.com',
      })
    ).toEqual({ ok: true });
  });
});
