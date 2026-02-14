import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { verifyWorkspaceMember } from '@/db/queries/workspaces';
import { getOrCreateStripeCustomer, createOneTimeCheckoutSession } from '@/lib/stripe-helpers';
import { resolveAppOrigin } from '@/lib/security/origin';
import { withApiLogging } from '@/lib/logging';
import { forbidden, unauthorized } from '@/lib/http';
import { readJsonBodyAs } from '@/lib/http-body';
import { z } from 'zod';

const stripePaymentSchema = z
  .object({
    workspaceId: z.coerce.number().int().positive(),
  })
  .strict();

/**
 * POST /api/stripe/payment
 * Create Stripe Checkout session for a one-time payment (example product).
 */
export const POST = withApiLogging('api.stripe.payment', async (request: NextRequest) => {
  const session = await getSession();
  if (!session) {
    throw unauthorized();
  }

  const { workspaceId } = await readJsonBodyAs(request, stripePaymentSchema);

  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw forbidden();
  }

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
});
