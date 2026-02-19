'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Messages } from '@/lib/messages';

interface PlanCardPlan {
  id: string;
  title: string;
  locale: string;
  mode: string;
  version: number;
  createdAt: Date | string;
  preferences: string;
}

interface PlanCardProps {
  plan: PlanCardPlan;
  onDelete: (id: string) => Promise<void>;
  onShare: (id: string) => Promise<string | null>;
  labels: Messages['planner']['history'];
  locale: string;
}

function getModeBadge(mode: string, labels: Messages['planner']['history']) {
  switch (mode) {
    case 'ai':
      return {
        label: labels.ai,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      };
    case 'fallback':
      return {
        label: labels.fallback,
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      };
    case 'cached':
      return {
        label: labels.cached,
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      };
    default:
      return {
        label: mode,
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      };
  }
}

function parseDestination(preferences: string): string | null {
  try {
    const parsed = JSON.parse(preferences) as Record<string, unknown>;
    if (typeof parsed.destinos === 'string' && parsed.destinos.length > 0) {
      return parsed.destinos;
    }
  } catch {
    // invalid JSON
  }
  return null;
}

export function PlanCard({ plan, onDelete, onShare, labels, locale }: PlanCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle');

  const createdAt = plan.createdAt instanceof Date ? plan.createdAt : new Date(plan.createdAt);
  const formattedDate = createdAt.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const modeBadge = getModeBadge(plan.mode, labels);
  const destination = parseDestination(plan.preferences);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(plan.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleShare = async () => {
    setShareStatus('loading');
    const url = await onShare(plan.id);
    if (url) {
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } else {
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{plan.title}</CardTitle>
          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${modeBadge.className}`}
            >
              {modeBadge.label}
            </span>
            {plan.version > 1 && (
              <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                v{plan.version}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          {destination && (
            <span>
              {labels.destination}: {destination}
            </span>
          )}
          <span>{formattedDate}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/planner/history/${plan.id}`}>{labels.view}</Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={shareStatus === 'loading'}
          >
            {shareStatus === 'loading'
              ? '...'
              : shareStatus === 'copied'
                ? labels.shared
                : shareStatus === 'error'
                  ? labels.shareError
                  : labels.share}
          </Button>

          <Button variant="outline" size="sm" asChild>
            <a href={`/api/planner/plans/${plan.id}/pdf`} download>
              PDF
            </a>
          </Button>

          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-destructive">{labels.deleteTitle}</span>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? labels.deleting : labels.deleteConfirm}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                {labels.deleteCancel}
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
              {labels.delete}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
