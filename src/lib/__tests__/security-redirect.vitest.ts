import { describe, expect, it } from 'vitest';
import { buildLoginRedirectHref, normalizeCallbackUrl } from '@/lib/security/redirect';

describe('normalizeCallbackUrl', () => {
  it('falls back when input is empty', () => {
    expect(normalizeCallbackUrl(null)).toBe('/dashboard');
    expect(normalizeCallbackUrl(undefined)).toBe('/dashboard');
    expect(normalizeCallbackUrl('')).toBe('/dashboard');
  });

  it('allows internal relative paths', () => {
    expect(normalizeCallbackUrl('/dashboard')).toBe('/dashboard');
    expect(normalizeCallbackUrl('/invite/abc?x=1')).toBe('/invite/abc?x=1');
  });

  it('rejects absolute and protocol-relative URLs', () => {
    expect(normalizeCallbackUrl('https://evil.example')).toBe('/dashboard');
    expect(normalizeCallbackUrl('http://evil.example')).toBe('/dashboard');
    expect(normalizeCallbackUrl('//evil.example')).toBe('/dashboard');
    expect(normalizeCallbackUrl('///evil.example')).toBe('/dashboard');
  });

  it('rejects backslash variants', () => {
    expect(normalizeCallbackUrl('/\\evil.example')).toBe('/dashboard');
    expect(normalizeCallbackUrl('/invite\\abc')).toBe('/dashboard');
  });

  it('rejects control characters', () => {
    expect(normalizeCallbackUrl('/dashboard\n/evil')).toBe('/dashboard');
    expect(normalizeCallbackUrl('/dashboard\r\n/evil')).toBe('/dashboard');
    expect(normalizeCallbackUrl('/dashboard\u0000evil')).toBe('/dashboard');
  });
});

describe('buildLoginRedirectHref', () => {
  it('builds login URL with encoded safe callback', () => {
    expect(buildLoginRedirectHref('/planner')).toBe('/login?callbackUrl=%2Fplanner');
  });

  it('falls back to default path when callback is unsafe', () => {
    expect(buildLoginRedirectHref('https://evil.example', { defaultPath: '/planner' })).toBe(
      '/login?callbackUrl=%2Fplanner'
    );
  });
});
