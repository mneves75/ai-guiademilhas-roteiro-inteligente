'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  FolderKanban,
  BarChart3,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkspaceSwitcher } from './workspace-switcher';
import { useLocale } from '@/contexts/locale-context';
import { m } from '@/lib/messages';
import { publicPathname } from '@/lib/locale-routing';

interface DashboardNavProps {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const t = m(locale);
  const homePath = publicPathname(locale, '/');

  const navigation = [
    { name: t.dashboard.nav.overview, href: '/dashboard', icon: LayoutDashboard },
    { name: t.dashboard.nav.workspaces, href: '/dashboard/workspaces', icon: FolderKanban },
    { name: t.dashboard.nav.team, href: '/dashboard/team', icon: Users },
    { name: t.dashboard.nav.analytics, href: '/dashboard/analytics', icon: BarChart3 },
    { name: t.dashboard.nav.billing, href: '/dashboard/billing', icon: CreditCard },
    { name: t.dashboard.nav.notifications, href: '/dashboard/notifications', icon: Mail },
    { name: t.dashboard.nav.settings, href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="hidden w-64 flex-col border-r bg-background lg:flex">
      <div className="flex h-14 items-center border-b px-4">
        <Link href={homePath} className="flex items-center gap-2 font-semibold">
          <span>Guia de Milhas</span>
        </Link>
      </div>

      <div className="p-4">
        <WorkspaceSwitcher />
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <span className="text-sm font-medium">
              {(user.name ?? user.email).charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium">{user.name ?? t.common.userFallback}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
