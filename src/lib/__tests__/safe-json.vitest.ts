import { describe, expect, it } from 'vitest';
import { safeJsonStringifyForHtmlScript } from '@/lib/security/safe-json';

describe('safeJsonStringifyForHtmlScript', () => {
  it('escapes HTML-breaking characters', () => {
    const out = safeJsonStringifyForHtmlScript({
      a: '</script><img src=x onerror=alert(1)>',
      b: '<svg><script>alert(1)</script></svg>',
      c: '&',
    });

    expect(out).not.toContain('</script>');
    expect(out).toContain('\\u003c/script\\u003e');
    expect(out).toContain('\\u003cimg');
    expect(out).toContain('\\u003csvg');
    expect(out).toContain('\\u0026');
  });

  it('returns a string for undefined', () => {
    expect(safeJsonStringifyForHtmlScript(undefined)).toBe('null');
  });
});
