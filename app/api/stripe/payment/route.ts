import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyWorkspaceMember } from '@/db/queries/workspaces';
import { getOrCreateStripeCustomer, createOneTimeCheckoutSession } from '@/lib/stripe-helpers';

/**
 * POST /api/stripe/payment
 * Create Stripe Checkout session for a one-time payment (example product).
 */
export async function POST(request: NextRequest) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { workspaceId } = body as { workspaceId: number };

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const customerId = await getOrCreateStripeCustomer(
      workspaceId,
      session.user.email,
      session.user.name ?? undefined
    );
    const origin = request.headers.get('origin') ?? 'http://localhost:3000';
    const paymentSession = await createOneTimeCheckoutSession({
      workspaceId,
      customerId,
      successUrl: `${origin}/dashboard/billing?payment=success`,
      cancelUrl: `${origin}/dashboard/billing?payment=canceled`,
    });
    return NextResponse.json({ sessionId: paymentSession.id, url: paymentSession.url });
  } catch (error) {
    console.error('One-time payment session error:', error);
    return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 });
  }
}
