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

export function AdminUserActions({ userId }: { userId: string }) {
  const router = useRouter();
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
        <Button variant="ghost" size="icon" disabled={loading} aria-label="User actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/users/${userId}`}>View Details</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={impersonate} disabled={loading}>
          {loading ? 'Impersonating…' : 'Impersonate'}
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" disabled>
          Disable Account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
