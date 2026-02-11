'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { m } from '@/lib/messages';
import { plannerLoginHref, plannerSignupHref } from '@/lib/planner/navigation';
import { useLocale } from '@/contexts/locale-context';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { locale } = useLocale();

  const t = m(locale);
  const loginHref = plannerLoginHref();
  const signupHref = plannerSignupHref();
  const navLinks = [
    { href: '#features', label: t.nav.features },
    { href: '#pricing', label: t.nav.pricing },
    { href: '#faq', label: t.nav.faq },
    { href: 'https://github.com/mneves75/nextjs-bootstrapped-shipped', label: t.nav.github },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={t.landing.mobileNavAriaOpen}
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <nav className="mt-8 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[10px] px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="my-4 h-px bg-border" />
          <Button asChild variant="ghost" className="w-full justify-start">
            <Link href={loginHref} onClick={() => setOpen(false)}>
              {t.nav.signIn}
            </Link>
          </Button>
          <Button asChild className="w-full">
            <Link href={signupHref} onClick={() => setOpen(false)}>
              {t.nav.getStarted}
            </Link>
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
