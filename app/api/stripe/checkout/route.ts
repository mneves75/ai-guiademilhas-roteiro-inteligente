import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyWorkspaceMember } from '@/db/queries/workspaces';
import { getOrCreateStripeCustomer, createCheckoutSession } from '@/lib/stripe-helpers';
import { getPlanPriceId, STRIPE_PLANS, type BillingInterval, type PlanId } from '@/lib/stripe';

/**
 * POST /api/stripe/checkout
 * Create Stripe Checkout session for subscription upgrade
 */
export async function POST(request: NextRequest) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { workspaceId, plan, interval } = body as {
    workspaceId: number;
    plan: PlanId;
    interval?: BillingInterval;
  };

  if (!workspaceId || !plan) {
    return NextResponse.json({ error: 'workspaceId and plan are required' }, { status: 400 });
  }

  // Verify user is owner/admin of workspace
  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get plan details
  const planConfig = STRIPE_PLANS[plan];
  const billingInterval: BillingInterval = interval === 'year' ? 'year' : 'month';
  const priceId = getPlanPriceId(plan, billingInterval);
  if (!planConfig || !priceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  try {
    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      workspaceId,
      session.user.email,
      session.user.name ?? undefined
    );

    // Create checkout session
    const origin = request.headers.get('origin') ?? 'http://localhost:3000';
    const checkoutSession = await createCheckoutSession({
      workspaceId,
      priceId,
      customerId,
      successUrl: `${origin}/dashboard/billing?success=true`,
      cancelUrl: `${origin}/dashboard/billing?canceled=true`,
    });

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
