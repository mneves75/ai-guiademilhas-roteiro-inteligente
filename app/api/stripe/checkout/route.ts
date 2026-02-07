import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyWorkspaceMember } from '@/db/queries/workspaces';
import { getOrCreateStripeCustomer, createCheckoutSession } from '@/lib/stripe-helpers';
import { getPlanPriceId, STRIPE_PLANS, type BillingInterval, type PlanId } from '@/lib/stripe';
import { resolveAppOrigin } from '@/lib/security/origin';

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const workspaceId =
    typeof body === 'object' && body !== null && 'workspaceId' in body
      ? (body as { workspaceId?: unknown }).workspaceId
      : undefined;
  const plan =
    typeof body === 'object' && body !== null && 'plan' in body
      ? (body as { plan?: unknown }).plan
      : undefined;
  const interval =
    typeof body === 'object' && body !== null && 'interval' in body
      ? (body as { interval?: unknown }).interval
      : undefined;

  if (typeof workspaceId !== 'number' || !Number.isFinite(workspaceId) || workspaceId <= 0) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }
  if (typeof plan !== 'string') {
    return NextResponse.json({ error: 'plan is required' }, { status: 400 });
  }
  if (interval !== undefined && typeof interval !== 'string') {
    return NextResponse.json({ error: 'Invalid interval' }, { status: 400 });
  }

  if (!(plan in STRIPE_PLANS)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const planId = plan as PlanId;

  // Verify user is owner/admin of workspace
  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get plan details
  const planConfig = STRIPE_PLANS[planId];
  const billingInterval: BillingInterval = interval === 'year' ? 'year' : 'month';
  const priceId = getPlanPriceId(planId, billingInterval);
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
    const origin = resolveAppOrigin(request);
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
