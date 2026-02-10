'use client';

import { useRouter } from 'next/navigation';
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

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'Português (Brasil)',
};

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [optimisticLocale, setOptimisticLocale] = useState<Locale | null>(null);

  // Clear optimistic state once the server-driven locale catches up (after router.refresh()).
  useEffect(() => {
    if (optimisticLocale && optimisticLocale === locale) setOptimisticLocale(null);
  }, [locale, optimisticLocale]);

  function onChange(next: string) {
    const nextLocale = next as Locale;
    if (nextLocale === locale) return;

    setOptimisticLocale(nextLocale);
    startTransition(async () => {
      await setLocaleAction(nextLocale);
      router.refresh();
    });
  }

  return (
    <Select value={optimisticLocale ?? locale} onValueChange={onChange} disabled={isPending}>
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
