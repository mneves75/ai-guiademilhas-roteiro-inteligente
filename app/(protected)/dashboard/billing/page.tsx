'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, CreditCard, ExternalLink } from 'lucide-react';
import { useWorkspace, useIsWorkspaceAdmin } from '@/contexts/workspace-context';
import { type PlanId } from '@/lib/plan-catalog';
import { useLocale } from '@/contexts/locale-context';
import { m } from '@/lib/messages';
import { toIntlLocale } from '@/lib/intl';
import {
  getLocalizedOneTimeProduct,
  getLocalizedPlan,
  getLocalizedPlans,
} from '@/lib/plan-catalog-localized';

type SubscriptionResponse = {
  plan: PlanId;
  planName: string;
  status?: string;
  features?: string[];
  priceMonthlyCents?: number | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean | null;
  hasCustomer: boolean;
};

function formatMoney(cents: number | null, locale: string, customLabel: string) {
  if (cents === null) return customLabel;
  if (cents === 0) return '$0';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function BillingPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const isAdmin = useIsWorkspaceAdmin();
  const { locale } = useLocale();
  const t = m(locale);
  const intlLocale = toIntlLocale(locale);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [interval, setInterval] = useState<'month' | 'year'>('month');

  useEffect(() => {
    async function load() {
      if (!currentWorkspace) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/stripe/subscription?workspaceId=${currentWorkspace.id}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? 'Failed to fetch subscription');
        }
        const data = (await res.json()) as SubscriptionResponse;
        setSubscription(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : t.common.unknownError);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentWorkspace, t.common.unknownError]);

  const currentPlanId = subscription?.plan ?? 'free';
  const currentPlan = useMemo(
    () => getLocalizedPlan(locale, currentPlanId),
    [locale, currentPlanId]
  );
  const plans = useMemo(() => getLocalizedPlans(locale), [locale]);
  const oneTimeProduct = useMemo(() => getLocalizedOneTimeProduct(locale), [locale]);

  async function startCheckout(plan: PlanId) {
    if (!currentWorkspace) return;
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: currentWorkspace.id, plan, interval }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to create checkout session');
      }
      if (data?.url) window.location.href = data.url as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.unknownError);
    }
  }

  async function openPortal() {
    if (!currentWorkspace) return;
    setError(null);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: currentWorkspace.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to create portal session');
      }
      if (data?.url) window.location.href = data.url as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.unknownError);
    }
  }

  async function startOneTimePayment() {
    if (!currentWorkspace) return;
    setError(null);
    try {
      const res = await fetch('/api/stripe/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: currentWorkspace.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to create payment session');
      }
      if (data?.url) window.location.href = data.url as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.unknownError);
    }
  }

  const isReady = !workspaceLoading && !!currentWorkspace;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard.billing.title}</h1>
        <p className="text-muted-foreground">{t.dashboard.billing.subtitle}</p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t.dashboard.billing.currentPlan}
          </CardTitle>
          <CardDescription>
            {loading
              ? t.dashboard.billing.loadingSubscription
              : t.dashboard.billing.youAreOnPlan(currentPlan.name)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">{currentPlan.name}</div>
            <div className="text-sm text-muted-foreground">
              {formatMoney(
                currentPlan.priceMonthlyCents,
                intlLocale,
                t.dashboard.billing.customPrice
              )}
              {currentPlan.priceMonthlyCents ? t.dashboard.billing.perMonth : ''}
            </div>
            {subscription?.status && (
              <div className="text-xs text-muted-foreground">
                {t.dashboard.billing.statusLabel} {subscription.status}
                {subscription.cancelAtPeriodEnd ? ` ${t.dashboard.billing.cancelsAtPeriodEnd}` : ''}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={openPortal}
              disabled={!isReady || loading || !subscription?.hasCustomer || !isAdmin}
              title={!isAdmin ? t.dashboard.billing.adminsOnlyManageBilling : undefined}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {t.dashboard.billing.customerPortal}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">{t.dashboard.billing.plansTitle}</h2>
        <div className="mb-4 flex gap-2">
          <Button
            type="button"
            variant={interval === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInterval('month')}
          >
            {t.dashboard.billing.monthly}
          </Button>
          <Button
            type="button"
            variant={interval === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInterval('year')}
          >
            {t.dashboard.billing.yearly}
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isHighlighted = plan.id === 'pro';
            const cents = interval === 'year' ? plan.priceYearlyCents : plan.priceMonthlyCents;
            return (
              <Card
                key={plan.id}
                className={`relative ${isHighlighted ? 'border-primary shadow-lg' : ''}`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    {t.dashboard.billing.popular}
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {formatMoney(cents, intlLocale, t.dashboard.billing.customPrice)}
                    </span>
                    {cents ? (
                      <span className="text-muted-foreground">
                        /
                        {interval === 'month'
                          ? t.dashboard.billing.intervalMonth
                          : t.dashboard.billing.intervalYear}
                      </span>
                    ) : null}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {plan.id === 'enterprise' ? (
                    <Button className="w-full" variant="outline" asChild>
                      <a href="mailto:sales@shipped.dev">{t.dashboard.billing.contactSales}</a>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isCurrent ? 'outline' : isHighlighted ? 'default' : 'outline'}
                      disabled={loading || !isReady || isCurrent || !isAdmin}
                      onClick={() => startCheckout(plan.id as PlanId)}
                      title={!isAdmin ? t.dashboard.billing.adminsOnlyChangePlans : undefined}
                    >
                      {isCurrent
                        ? t.dashboard.billing.currentPlanButton
                        : t.dashboard.billing.upgrade}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.billing.oneTimeTitle}</CardTitle>
          <CardDescription>{oneTimeProduct.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium">{oneTimeProduct.name}</div>
            <div className="text-muted-foreground">
              {formatMoney(oneTimeProduct.priceCents, intlLocale, t.dashboard.billing.customPrice)}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={startOneTimePayment}
            disabled={!isReady || loading || !isAdmin}
            title={!isAdmin ? t.dashboard.billing.adminsOnlyPurchase : undefined}
          >
            {t.dashboard.billing.buy}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
