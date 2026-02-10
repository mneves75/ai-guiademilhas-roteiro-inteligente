import type { Locale } from './locale';

export type PublicLocaleSegment = 'en' | 'pt-br';

export function localeToPublicSegment(locale: Locale): PublicLocaleSegment {
  return locale === 'pt-BR' ? 'pt-br' : 'en';
}

export function publicSegmentToLocale(segment: string): Locale | null {
  if (segment === 'en') return 'en';
  if (segment === 'pt-br') return 'pt-BR';
  return null;
}

/**
 * Returns the public, SEO-stable pathname for a locale (e.g. `/en/pricing`, `/pt-br/blog/foo`).
 *
 * Input `pathname` must be absolute (start with `/`) and must NOT already include a locale prefix.
 */
export function publicPathname(locale: Locale, pathname: string): string {
  const seg = localeToPublicSegment(locale);
  const normalized = pathname === '/' ? '' : pathname;
  return `/${seg}${normalized}`;
}

export function stripPublicLocalePrefix(pathname: string): {
  locale: Locale;
  restPathname: string;
} | null {
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const rest = pathname.slice('/en'.length) || '/';
    return { locale: 'en', restPathname: rest };
  }
  if (pathname === '/pt-br' || pathname.startsWith('/pt-br/')) {
    const rest = pathname.slice('/pt-br'.length) || '/';
    return { locale: 'pt-BR', restPathname: rest };
  }
  return null;
}
