'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Locale } from '@/lib/locale';
import { useLocale } from '@/contexts/locale-context';
import { setLocaleAction } from '@/lib/locale-actions';
import { publicPathname, stripPublicLocalePrefix } from '@/lib/locale-routing';

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'Português (Brasil)',
};

function isPublicLocalizedPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/blog' ||
    pathname.startsWith('/blog/') ||
    pathname === '/pricing' ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/security'
  );
}

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);
  const [optimisticLocale, setOptimisticLocale] = useState<Locale | null>(null);

  // Clear optimistic state once the server-driven locale catches up (after router.refresh()).
  useEffect(() => {
    if (optimisticLocale && optimisticLocale === locale) setOptimisticLocale(null);
  }, [locale, optimisticLocale]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  function onChange(next: string) {
    const nextLocale = next as Locale;
    if (nextLocale === locale) return;

    setOptimisticLocale(nextLocale);
    startTransition(async () => {
      try {
        // If the user is on a public, locale-prefixed page, switch the URL too.
        // Otherwise, keep the current URL and just refresh to pick up the cookie.
        const query = searchParams.toString();
        const withQuery = (path: string) => (query ? `${path}?${query}` : path);
        const prefixed = stripPublicLocalePrefix(pathname);
        if (prefixed && isPublicLocalizedPath(prefixed.restPathname)) {
          router.replace(withQuery(publicPathname(nextLocale, prefixed.restPathname)));
        }
        if (!prefixed && isPublicLocalizedPath(pathname)) {
          router.replace(withQuery(publicPathname(nextLocale, pathname)));
        }

        // Best-effort persistence: the URL determines the effective locale on public pages, but
        // we still keep a cookie for non-prefixed surfaces (auth/protected) and future visits.
        await setLocaleAction(nextLocale);
        router.refresh();
      } catch {
        // Network/runtime failures should not leave the control stuck in an optimistic state.
        setOptimisticLocale(null);
      }
    });
  }

  return (
    <Select
      value={optimisticLocale ?? locale}
      onValueChange={onChange}
      disabled={!hydrated || isPending}
    >
      <SelectTrigger
        className="h-9 w-[140px]"
        aria-label={locale === 'pt-BR' ? 'Idioma' : 'Language'}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{LOCALE_LABELS.en}</SelectItem>
        <SelectItem value="pt-BR">{LOCALE_LABELS['pt-BR']}</SelectItem>
      </SelectContent>
    </Select>
  );
}
