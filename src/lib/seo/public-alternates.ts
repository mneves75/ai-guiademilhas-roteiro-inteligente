import type { Metadata } from 'next';
import type { Locale } from '@/lib/locale';
import { publicPathname } from '@/lib/locale-routing';

export function publicAlternates(
  locale: Locale,
  pathname: string
): NonNullable<Metadata['alternates']> {
  const en = publicPathname('en', pathname);
  const ptBr = publicPathname('pt-BR', pathname);

  return {
    canonical: publicPathname(locale, pathname),
    languages: {
      'x-default': en,
      'en-US': en,
      'pt-BR': ptBr,
    },
    types: {
      'application/rss+xml': '/rss.xml',
    },
  };
}
