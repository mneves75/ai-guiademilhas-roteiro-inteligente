import 'server-only';

import Stripe from 'stripe';
import { PLAN_CATALOG, type PlanId } from './plan-catalog';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

/**
 * Stripe price IDs for subscription plans
 * Configure these in your Stripe dashboard
 */
export const STRIPE_PLANS = {
  free: {
    priceIds: null as null | { month: string; year: string },
    ...PLAN_CATALOG.free,
  },
  pro: {
    priceIds: {
      month: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? '',
      year: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? '',
    },
    ...PLAN_CATALOG.pro,
  },
  enterprise: {
    priceIds: {
      month: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID ?? '',
      year: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID ?? '',
    },
    ...PLAN_CATALOG.enterprise,
  },
} as const;

export type { PlanId };

export type BillingInterval = 'month' | 'year';

export function getPlanPriceId(plan: PlanId, interval: BillingInterval): string | null {
  const config = STRIPE_PLANS[plan];
  if (!config.priceIds) return null;
  const priceId = config.priceIds[interval];
  return priceId || null;
}

export function getOneTimePriceId(): string {
  const priceId = process.env.STRIPE_ONE_TIME_PRICE_ID;
  if (!priceId) {
    throw new Error('STRIPE_ONE_TIME_PRICE_ID is not set');
  }
  return priceId;
}
