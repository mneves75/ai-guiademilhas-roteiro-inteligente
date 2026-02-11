import { describe, expect, it } from 'vitest';
import { parseBodyFieldErrors } from '@/lib/auth/error-utils';

describe('parseBodyFieldErrors', () => {
  it('returns empty object for non-string input', () => {
    expect(parseBodyFieldErrors(null)).toEqual({});
    expect(parseBodyFieldErrors(undefined)).toEqual({});
    expect(parseBodyFieldErrors({})).toEqual({});
    expect(parseBodyFieldErrors(123)).toEqual({});
  });

  it('parses multiple [body.<field>] segments', () => {
    const msg =
      '[body.email] Invalid email address; [body.password] Too small: expected string to have >=1 characters';
    expect(parseBodyFieldErrors(msg)).toEqual({
      email: 'Invalid email address',
      password: 'Too small: expected string to have >=1 characters',
    });
  });

  it('ignores empty matches', () => {
    expect(parseBodyFieldErrors('[body.email]  ;')).toEqual({});
  });
});
