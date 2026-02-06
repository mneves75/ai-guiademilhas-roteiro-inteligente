'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, CreditCard, ExternalLink } from 'lucide-react';
import { useWorkspace, useIsWorkspaceAdmin } from '@/contexts/workspace-context';
import { PLAN_CATALOG, type PlanId, ONE_TIME_PRODUCT } from '@/lib/plan-catalog';

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

function formatMoney(cents: number | null, locale = 'en-US') {
  if (cents === null) return 'Custom';
  if (cents === 0) return '$0';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function BillingPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const isAdmin = useIsWorkspaceAdmin();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const locale =
    typeof document !== 'undefined' ? document.documentElement.lang || 'en-US' : 'en-US';

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
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentWorkspace]);

  const currentPlanId = subscription?.plan ?? 'free';
  const plans = useMemo(() => Object.values(PLAN_CATALOG), []);

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
      setError(e instanceof Error ? e.message : 'Unknown error');
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
      setError(e instanceof Error ? e.message : 'Unknown error');
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
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  const isReady = !workspaceLoading && !!currentWorkspace;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your workspace subscription.</p>
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
            Current Plan
          </CardTitle>
          <CardDescription>
            {loading
              ? 'Loading subscription…'
              : `You are on the ${PLAN_CATALOG[currentPlanId].name} plan.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">{PLAN_CATALOG[currentPlanId].name}</div>
            <div className="text-sm text-muted-foreground">
              {formatMoney(PLAN_CATALOG[currentPlanId].priceMonthlyCents, locale)}
              {PLAN_CATALOG[currentPlanId].priceMonthlyCents ? '/month' : ''}
            </div>
            {subscription?.status && (
              <div className="text-xs text-muted-foreground">
                Status: {subscription.status}
                {subscription.cancelAtPeriodEnd ? ' (cancels at period end)' : ''}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={openPortal}
              disabled={!isReady || loading || !subscription?.hasCustomer || !isAdmin}
              title={!isAdmin ? 'Only workspace admins can manage billing' : undefined}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Customer Portal
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Plans</h2>
        <div className="mb-4 flex gap-2">
          <Button
            type="button"
            variant={interval === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInterval('month')}
          >
            Monthly
          </Button>
          <Button
            type="button"
            variant={interval === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInterval('year')}
          >
            Yearly
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
                    Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{formatMoney(cents, locale)}</span>
                    {cents ? <span className="text-muted-foreground">/{interval}</span> : null}
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
                      <a href="mailto:sales@shipped.dev">Contact Sales</a>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isCurrent ? 'outline' : isHighlighted ? 'default' : 'outline'}
                      disabled={loading || !isReady || isCurrent || !isAdmin}
                      onClick={() => startCheckout(plan.id as PlanId)}
                      title={!isAdmin ? 'Only workspace admins can change plans' : undefined}
                    >
                      {isCurrent ? 'Current Plan' : 'Upgrade'}
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
          <CardTitle>One-time payment</CardTitle>
          <CardDescription>{ONE_TIME_PRODUCT.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium">{ONE_TIME_PRODUCT.name}</div>
            <div className="text-muted-foreground">
              {formatMoney(ONE_TIME_PRODUCT.priceCents, locale)}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={startOneTimePayment}
            disabled={!isReady || loading || !isAdmin}
            title={!isAdmin ? 'Only workspace admins can purchase' : undefined}
          >
            Buy
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
