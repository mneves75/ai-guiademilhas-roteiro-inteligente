export type Locale = 'en' | 'pt-BR';

export const LOCALE_COOKIE = 'shipped_locale';

export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'pt-BR'] as const;

export function normalizeLocale(input: string | null | undefined): Locale {
  const raw = (input ?? '').trim();
  if (!raw) return 'pt-BR';

  const lower = raw.toLowerCase();
  if (lower === 'en' || lower === 'en-us' || lower === 'en_us') return 'en';
  if (lower === 'pt' || lower === 'pt-br' || lower === 'pt_br' || raw === 'pt-BR') return 'pt-BR';

  return 'pt-BR';
}
