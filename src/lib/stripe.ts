import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not set. Stripe functionality will fail.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');

/**
 * Stripe price IDs for subscription plans
 * Configure these in your Stripe dashboard
 */
export const STRIPE_PLANS = {
  free: {
    name: 'Free',
    priceId: null,
    price: 0,
    features: ['1 workspace', '3 team members', 'Community support', 'Basic analytics'],
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? '',
    price: 1900, // $19.00 in cents
    features: [
      'Unlimited workspaces',
      'Unlimited team members',
      'Priority support',
      'Advanced analytics',
      'Custom integrations',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? '',
    price: null, // Custom pricing
    features: [
      'Everything in Pro',
      'Dedicated support',
      'SLA guarantee',
      'Custom contracts',
      'On-premise option',
    ],
  },
} as const;

export type PlanId = keyof typeof STRIPE_PLANS;
