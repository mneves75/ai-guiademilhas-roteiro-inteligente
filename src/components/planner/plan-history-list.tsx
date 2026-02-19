'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlanCard } from './plan-card';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/locale-context';
import { m } from '@/lib/messages';

interface PlanSummary {
  id: string;
  title: string;
  locale: string;
  mode: string;
  version: number;
  createdAt: Date | string;
  preferences: string;
  report: string;
}

interface PlanHistoryListProps {
  plans: PlanSummary[];
  currentPage: number;
  totalPages: number;
}

export function PlanHistoryList({ plans, currentPage, totalPages }: PlanHistoryListProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = m(locale).planner.history;
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/planner/plans/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setRemovedIds((prev) => new Set(prev).add(id));
      router.refresh();
    }
  };

  const handleShare = async (id: string): Promise<string | null> => {
    const plan = plans.find((p) => p.id === id);
    if (!plan) return null;

    let report: unknown;
    try {
      report = JSON.parse(plan.report);
    } catch {
      return null;
    }

    const res = await fetch('/api/planner/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report, locale: plan.locale }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { url?: string };
    if (data.url) {
      const fullUrl = `${window.location.origin}${data.url}`;
      await navigator.clipboard.writeText(fullUrl);
      return fullUrl;
    }
    return null;
  };

  const visiblePlans = plans.filter((p) => !removedIds.has(p.id));

  if (visiblePlans.length === 0 && currentPage === 1) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-muted-foreground">{t.empty}</p>
        <Button asChild>
          <Link href="/planner">{t.emptyAction}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {visiblePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onDelete={handleDelete}
            onShare={handleShare}
            labels={t}
            locale={locale}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => router.push(`/planner/history?page=${currentPage - 1}`)}
          >
            {t.previous}
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => router.push(`/planner/history?page=${currentPage + 1}`)}
          >
            {t.next}
          </Button>
        </div>
      )}
    </div>
  );
}
