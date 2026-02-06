import { LOCALE_COOKIE, normalizeLocale, type Locale } from './locale';

export function getClientLocale(): Locale {
  if (typeof document === 'undefined') return 'en';

  const match = document.cookie
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${LOCALE_COOKIE}=`));
  const value = match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
  return normalizeLocale(value);
}

export function setClientLocale(locale: Locale) {
  if (typeof document === 'undefined') return;

  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; path=/; max-age=${oneYear}; samesite=lax`;
  document.documentElement.lang = locale;
}
