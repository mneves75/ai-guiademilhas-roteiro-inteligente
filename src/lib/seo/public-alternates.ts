import type { Metadata } from 'next';
import type { Locale } from '@/lib/locale';
import { publicPathname } from '@/lib/locale-routing';

const RSS_TYPES: NonNullable<Metadata['alternates']>['types'] = {
  'application/rss+xml': '/rss.xml',
};

function buildLanguages(
  pathname: string,
  availableLocales: readonly Locale[]
): NonNullable<Metadata['alternates']>['languages'] | undefined {
  if (availableLocales.length <= 1) return undefined;

  const languages: NonNullable<Metadata['alternates']>['languages'] = {};

  // Only advertise hreflang entries that actually exist (avoid pointing to 404).
  for (const l of availableLocales) {
    if (l === 'en') languages['en-US'] = publicPathname('en', pathname);
    if (l === 'pt-BR') languages['pt-BR'] = publicPathname('pt-BR', pathname);
  }

  // Prefer `x-default` to point at English when available.
  if (availableLocales.includes('en')) languages['x-default'] = publicPathname('en', pathname);

  return Object.keys(languages).length > 0 ? languages : undefined;
}

export function publicAlternates(
  locale: Locale,
  pathname: string,
  opts?: { availableLocales?: readonly Locale[] }
): NonNullable<Metadata['alternates']> {
  const availableLocales = opts?.availableLocales ?? (['en', 'pt-BR'] as const);
  const languages = buildLanguages(pathname, availableLocales);

  return {
    canonical: publicPathname(locale, pathname),
    ...(languages ? { languages } : {}),
    types: RSS_TYPES,
  };
}
