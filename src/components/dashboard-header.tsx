'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/contexts/locale-context';
import { m } from '@/lib/messages';

interface DashboardHeaderProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
  impersonatedBy?: string | null;
}

export function DashboardHeader({ user, impersonatedBy }: DashboardHeaderProps) {
  const router = useRouter();
  const [stopping, setStopping] = useState(false);
  const { locale } = useLocale();
  const t = m(locale);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/');
    router.refresh();
  };

  const handleStopImpersonating = async () => {
    setStopping(true);
    try {
      await fetch('/api/auth/admin/stop-impersonating', { method: 'POST' });
      router.push('/admin');
      router.refresh();
    } finally {
      setStopping(false);
    }
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">{t.dashboard.header.toggleMenu}</span>
      </Button>

      <div className="hidden md:block">
        <WorkspaceSwitcher />
      </div>

      <div className="flex-1">
        <form>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t.dashboard.header.searchPlaceholder}
              className="w-full max-w-sm bg-muted/50 pl-8 md:w-[300px]"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-2">
        {impersonatedBy && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStopImpersonating}
            disabled={stopping}
            className="hidden sm:inline-flex"
          >
            {stopping ? t.dashboard.header.stopping : t.dashboard.header.stopImpersonating}
          </Button>
        )}

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
          <span className="sr-only">{t.dashboard.header.notifications}</span>
        </Button>

        <LanguageSwitcher />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
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
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">{t.dashboard.nav.settings}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/billing">{t.dashboard.nav.billing}</Link>
            </DropdownMenuItem>
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
