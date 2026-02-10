import { describe, expect, it } from 'vitest';
import { publicAlternates } from '@/lib/seo/public-alternates';

describe('publicAlternates', () => {
  it('includes hreflang only when multiple locales are available', () => {
    const single = publicAlternates('en', '/blog/foo', { availableLocales: ['en'] });
    expect(single.canonical).toBe('/en/blog/foo');
    expect(single.languages).toBeUndefined();
    expect(single.types?.['application/rss+xml']).toBe('/rss.xml');

    const multi = publicAlternates('en', '/pricing', { availableLocales: ['en', 'pt-BR'] });
    expect(multi.canonical).toBe('/en/pricing');
    expect(multi.languages?.['en-US']).toBe('/en/pricing');
    expect(multi.languages?.['pt-BR']).toBe('/pt-br/pricing');
    expect(multi.languages?.['x-default']).toBe('/en/pricing');
  });
});
