import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyWorkspaceMember } from '@/db/queries/workspaces';
import { getWorkspaceSubscription } from '@/lib/stripe-helpers';
import { STRIPE_PLANS } from '@/lib/stripe';
import { withApiLogging } from '@/lib/logging';
import { badRequest, forbidden, unauthorized } from '@/lib/http';

/**
 * GET /api/stripe/subscription?workspaceId=123
 * Get subscription status for a workspace
 */
export const GET = withApiLogging('api.stripe.subscription', async (request: NextRequest) => {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw unauthorized();
  }

  const workspaceIdParam = request.nextUrl.searchParams.get('workspaceId');
  if (!workspaceIdParam) {
    throw badRequest('workspaceId is required');
  }

  const workspaceId = Number(workspaceIdParam);
  if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
    throw badRequest('Invalid workspaceId');
  }

  // Verify user is member of workspace
  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership) {
    throw forbidden();
  }

  const subscription = await getWorkspaceSubscription(workspaceId);
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
});
