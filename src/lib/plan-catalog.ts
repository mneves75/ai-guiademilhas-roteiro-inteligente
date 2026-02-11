/**
 * Client-safe plan catalog.
 *
 * This file must not import server-only Stripe SDKs or reference non-public env vars.
 * Server code can map `PlanId` -> Stripe price IDs via server-side config.
 */

export const PLAN_CATALOG = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthlyCents: 0,
    priceYearlyCents: 0,
    description: 'For individuals and small projects',
    features: ['1 workspace', '3 team members', 'Community support', 'Basic analytics'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthlyCents: 1900,
    priceYearlyCents: 19000,
    description: 'For growing teams',
    features: [
      'Unlimited workspaces',
      'Unlimited team members',
      'Priority support',
      'Advanced analytics',
      'Custom integrations',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthlyCents: null,
    priceYearlyCents: null,
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'SLA guarantee',
      'Custom contracts',
      'On-premise option',
    ],
  },
} as const;

export type PlanId = keyof typeof PLAN_CATALOG;

export const ONE_TIME_PRODUCT = {
  id: 'credits_pack',
  name: 'Credits Pack',
  priceCents: 4900,
  description: 'One-time purchase (example).',
} as const;
