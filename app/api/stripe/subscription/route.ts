import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyWorkspaceMember } from '@/db/queries/workspaces';
import { getWorkspaceSubscription } from '@/lib/stripe-helpers';
import { STRIPE_PLANS } from '@/lib/stripe';

/**
 * GET /api/stripe/subscription?workspaceId=123
 * Get subscription status for a workspace
 */
export async function GET(request: NextRequest) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = request.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  // Verify user is member of workspace
  const membership = await verifyWorkspaceMember(Number(workspaceId), session.user.id);
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const subscription = await getWorkspaceSubscription(Number(workspaceId));
  const planConfig = STRIPE_PLANS[subscription.plan];

  return NextResponse.json({
    plan: subscription.plan,
    planName: planConfig.name,
    status: subscription.status,
    features: planConfig.features,
    priceMonthlyCents: planConfig.priceMonthlyCents,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    hasCustomer: !!subscription.customerId,
  });
}
