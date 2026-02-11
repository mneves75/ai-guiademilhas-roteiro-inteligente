'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import type { PlanId } from '@/lib/plan-catalog';
import { useLocale } from '@/contexts/locale-context';
import { m } from '@/lib/messages';

type SubscriptionResponse = {
  plan: PlanId;
};

export default function AnalyticsPage() {
  const { currentWorkspace } = useWorkspace();
  const { locale } = useLocale();
  const t = m(locale);
  const [plan, setPlan] = useState<PlanId>('free');
  const [loading, setLoading] = useState(true);

  const stats = [
    { name: t.dashboard.analytics.stats.totalViews, value: '0', change: '+0%', icon: Eye },
    { name: t.dashboard.analytics.stats.uniqueVisitors, value: '0', change: '+0%', icon: Users },
    { name: t.dashboard.analytics.stats.growth, value: '0%', change: '+0%', icon: TrendingUp },
    { name: t.dashboard.analytics.stats.avgSession, value: '0m', change: '+0%', icon: BarChart3 },
  ];

  useEffect(() => {
    async function load() {
      if (!currentWorkspace) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/stripe/subscription?workspaceId=${currentWorkspace.id}`);
        if (res.ok) {
          const data = (await res.json()) as SubscriptionResponse;
          setPlan(data.plan);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentWorkspace]);

  if (!loading && plan === 'free') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t.dashboard.analytics.title}</h1>
          <p className="text-muted-foreground">{t.dashboard.analytics.paidOnly}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.analytics.upgradeTitle}</CardTitle>
            <CardDescription>{t.dashboard.analytics.upgradeSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/billing">{t.dashboard.analytics.viewPlans}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard.analytics.title}</h1>
        <p className="text-muted-foreground">{t.dashboard.analytics.subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change} {t.dashboard.analytics.fromLastMonth}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.analytics.activityOverview}</CardTitle>
            <CardDescription>{t.dashboard.analytics.activityOverviewSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  {t.dashboard.analytics.chartsComingSoon}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.dashboard.analytics.connectDataSources}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.analytics.topPages}</CardTitle>
            <CardDescription>{t.dashboard.analytics.topPagesSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  {t.dashboard.analytics.noDataYet}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.dashboard.analytics.startUsingWorkspace}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
