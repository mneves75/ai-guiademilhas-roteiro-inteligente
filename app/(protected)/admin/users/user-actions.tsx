'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { useLocale } from '@/contexts/locale-context';
import { m } from '@/lib/messages';

export function AdminUserActions({ userId }: { userId: string }) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = m(locale);
  const [loading, setLoading] = useState(false);

  async function impersonate() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin/impersonate-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? data?.error ?? 'Failed to impersonate user');
      }
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={loading}
          aria-label={t.admin.users.actionsAria}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/users/${userId}`}>{t.admin.users.viewDetails}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={impersonate} disabled={loading}>
          {loading ? t.admin.users.impersonating : t.admin.users.impersonate}
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" disabled>
          {t.admin.users.disableAccount}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
