import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyWorkspaceMember } from '@/db/queries/workspaces';
import { getOrCreateStripeCustomer, createCheckoutSession } from '@/lib/stripe-helpers';
import { getPlanPriceId, STRIPE_PLANS, type BillingInterval, type PlanId } from '@/lib/stripe';
import { resolveAppOrigin } from '@/lib/security/origin';
import { withApiLogging } from '@/lib/logging';
import { badRequest, forbidden, unauthorized } from '@/lib/http';
import { readJsonBodyAs } from '@/lib/http-body';
import { z } from 'zod';

const stripeCheckoutSchema = z
  .object({
    workspaceId: z.coerce.number().int().positive(),
    plan: z.enum(['free', 'pro', 'enterprise']),
    interval: z.enum(['month', 'year']).optional(),
  })
  .strict();

/**
 * POST /api/stripe/checkout
 * Create Stripe Checkout session for subscription upgrade
 */
export const POST = withApiLogging('api.stripe.checkout', async (request: NextRequest) => {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw unauthorized();
  }

  const { workspaceId, plan, interval } = await readJsonBodyAs(request, stripeCheckoutSchema);

  if (!(plan in STRIPE_PLANS)) throw badRequest('Invalid plan');

  const planId = plan as PlanId;

  // Verify user is owner/admin of workspace
  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw forbidden();
  }

  // Get plan details
  const planConfig = STRIPE_PLANS[planId];
  const billingInterval: BillingInterval = interval === 'year' ? 'year' : 'month';
  const priceId = getPlanPriceId(planId, billingInterval);
  if (!planConfig || !priceId) {
    throw badRequest('Invalid plan');
  }

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer(
    workspaceId,
    session.user.email,
    session.user.name ?? undefined
  );

  // Create checkout session
  const origin = resolveAppOrigin(request);
  const checkoutSession = await createCheckoutSession({
    workspaceId,
    priceId,
    customerId,
    successUrl: `${origin}/dashboard/billing?success=true`,
    cancelUrl: `${origin}/dashboard/billing?canceled=true`,
  });

  return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
});
