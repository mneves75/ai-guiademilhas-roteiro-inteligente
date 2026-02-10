'use client';

import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { setClientLocale } from '@/lib/locale-client';
import type { Locale } from '@/lib/locale';
import { useLocale } from '@/contexts/locale-context';

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'pt-BR',
};

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale: value, setLocale } = useLocale();

  function onChange(next: string) {
    const locale = next as Locale;
    setLocale(locale);
    setClientLocale(locale);
    router.refresh();
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[96px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{LOCALE_LABELS.en}</SelectItem>
        <SelectItem value="pt-BR">{LOCALE_LABELS['pt-BR']}</SelectItem>
      </SelectContent>
    </Select>
  );
}
