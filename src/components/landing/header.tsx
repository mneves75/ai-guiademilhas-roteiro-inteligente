'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileNav } from './mobile-nav';
import { LanguageSwitcher } from '@/components/language-switcher';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/locale-context';
import { m } from '@/lib/messages';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { locale } = useLocale();
  const t = m(locale).nav;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'glass-header sticky top-0 z-50 w-full transition-shadow duration-200',
        scrolled && 'shadow-sm'
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-lg font-bold">Shipped</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link
            href="#features"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.features}
          </Link>
          <Link
            href="#pricing"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.pricing}
          </Link>
          <Link
            href="#faq"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.faq}
          </Link>
          <Link
            href="https://github.com/mneves75/nextjs-bootstrapped-shipped"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.github}
          </Link>
        </nav>

        <nav aria-label="Primary" className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />

          <Button asChild variant="ghost" size="icon" className="sm:hidden">
            <Link href="/login" aria-label={t.signIn}>
              <LogIn className="h-4 w-4" />
            </Link>
          </Button>

          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">{t.signIn}</Link>
          </Button>

          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/signup">{t.getStarted}</Link>
          </Button>

          <MobileNav />
        </nav>
      </div>
    </header>
  );
}
