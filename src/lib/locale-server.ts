import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { cache } from 'react';
import { LOCALE_COOKIE, normalizeLocale, type Locale } from './locale';

function localeFromAcceptLanguage(value: string | null): Locale | null {
  if (!value) return null;

  let best: { locale: Locale; q: number } | null = null;
  for (const rawPart of value.split(',')) {
    const part = rawPart.trim();
    if (!part) continue;

    const [tagRaw, ...params] = part.split(';').map((s) => s.trim());
    const tag = tagRaw ?? '';

    // Only accept explicit supported matches; do not treat unknown as "en".
    const normalized = (() => {
      const lower = tag.toLowerCase();
      if (lower === 'en' || lower.startsWith('en-') || lower.startsWith('en_')) return 'en';
      if (lower === 'pt' || lower === 'pt-br' || lower === 'pt_br') return 'pt-BR';
      return null;
    })();
    if (!normalized) continue;

    let q = 1;
    for (const p of params) {
      if (p.startsWith('q=')) {
        const n = Number.parseFloat(p.slice(2));
        if (Number.isFinite(n)) q = n;
      }
    }

    if (!best || q > best.q) best = { locale: normalized, q };
  }

  return best?.locale ?? null;
}

export const getRequestLocale = cache(async (): Promise<Locale> => {
  const c = await cookies();
  const fromCookie = c.get(LOCALE_COOKIE)?.value;
  if (fromCookie) return normalizeLocale(fromCookie);

  const h = await headers();
  const fromHeader = localeFromAcceptLanguage(h.get('accept-language'));
  return fromHeader ?? 'en';
});
