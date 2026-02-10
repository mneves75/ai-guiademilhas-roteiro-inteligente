import { describe, expect, it } from 'vitest';
import { normalizeCallbackUrl } from '@/lib/security/redirect';

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
