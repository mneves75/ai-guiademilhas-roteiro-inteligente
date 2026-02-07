import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyWorkspaceMember } from '@/db/queries/workspaces';
import { getOrCreateStripeCustomer, createOneTimeCheckoutSession } from '@/lib/stripe-helpers';
import { resolveAppOrigin } from '@/lib/security/origin';

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

  if (typeof workspaceId !== 'number' || !Number.isFinite(workspaceId) || workspaceId <= 0) {
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
    const origin = resolveAppOrigin(request);
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
