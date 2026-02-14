'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/lib/auth-client';
import { useLocale } from '@/contexts/locale-context';
import { m } from '@/lib/messages';
import { publicPathname } from '@/lib/locale-routing';

interface PlannerHeaderProps {
  user: { id: string; name: string | null; email: string };
}

export function PlannerHeader({ user }: PlannerHeaderProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = m(locale);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <Link href={publicPathname(locale, '/')} className="font-semibold">
        Guia de Milhas
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="sr-only sm:hidden">{t.planner.header.backToDashboard}</span>
            <span className="hidden sm:inline">{t.planner.header.backToDashboard}</span>
          </Link>
        </Button>

        <Button variant="ghost" size="sm" asChild>
          <Link href="/planner/history">
            <History className="h-4 w-4 sm:mr-2" />
            <span className="sr-only sm:hidden">{t.planner.history.title}</span>
            <span className="hidden sm:inline">{t.planner.history.title}</span>
          </Link>
        </Button>

        <LanguageSwitcher />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label={t.common.userFallback}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-medium">
                  {(user.name ?? user.email).charAt(0).toUpperCase()}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user.name ?? t.common.userFallback}</span>
                <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              {t.dashboard.header.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
