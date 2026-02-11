import type { Locale } from './locale';

export function toIntlLocale(locale: Locale): string {
  return locale === 'pt-BR' ? 'pt-BR' : 'en-US';
}
