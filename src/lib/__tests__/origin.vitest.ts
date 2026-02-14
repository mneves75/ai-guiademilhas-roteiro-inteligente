import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { resolveAppOrigin } from '@/lib/security/origin';

describe('resolveAppOrigin', () => {
  const oldEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...oldEnv };
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  it('prefers NEXT_PUBLIC_APP_URL (origin only)', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com/some/path';
    const request = { nextUrl: { origin: 'http://localhost:3000' } } as never;
    expect(resolveAppOrigin(request)).toBe('https://example.com');
  });

  it('falls back to request origin in non-production', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';

    const request = {
      nextUrl: { origin: 'http://localhost:3000' },
      headers: new Headers(),
    } as never;
    expect(resolveAppOrigin(request)).toBe('http://localhost:3000');
  });

  it('uses forwarded host/proto in non-production when env origin is missing', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';

    const request = {
      nextUrl: { origin: 'http://localhost:3000', protocol: 'http:' },
      headers: new Headers({ 'x-forwarded-host': 'preview.example', 'x-forwarded-proto': 'https' }),
    } as never;
    expect(resolveAppOrigin(request)).toBe('https://preview.example');
  });

  it('throws in production when env origin is missing', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

    const request = { nextUrl: { origin: 'https://attacker.example' } } as never;
    expect(() => resolveAppOrigin(request)).toThrow(/Missing NEXT_PUBLIC_APP_URL/);
  });
});
