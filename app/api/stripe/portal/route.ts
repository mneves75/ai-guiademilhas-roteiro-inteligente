import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyWorkspaceMember } from '@/db/queries/workspaces';
import { getWorkspaceSubscription, createPortalSession } from '@/lib/stripe-helpers';
import { resolveAppOrigin } from '@/lib/security/origin';
import { withApiLogging } from '@/lib/logging';
import { badRequest, forbidden, unauthorized } from '@/lib/http';
import { readJsonBodyAs } from '@/lib/http-body';
import { z } from 'zod';

const stripePortalSchema = z
  .object({
    workspaceId: z.coerce.number().int().positive(),
  })
  .strict();

/**
 * POST /api/stripe/portal
 * Create Stripe Customer Portal session
 */
export const POST = withApiLogging('api.stripe.portal', async (request: NextRequest) => {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw unauthorized();
  }

  const { workspaceId } = await readJsonBodyAs(request, stripePortalSchema);

  // Verify user is owner/admin of workspace
  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw forbidden();
  }

  // Get subscription to find customer ID
  const subscription = await getWorkspaceSubscription(workspaceId);
  if (!subscription.customerId) {
    throw badRequest('No billing account found');
  }

  const origin = resolveAppOrigin(request);
  const portalSession = await createPortalSession({
    customerId: subscription.customerId,
    returnUrl: `${origin}/dashboard/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
});
