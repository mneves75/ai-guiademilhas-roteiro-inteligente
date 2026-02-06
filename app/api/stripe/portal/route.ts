import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyWorkspaceMember } from '@/db/queries/workspaces';
import { getWorkspaceSubscription, createPortalSession } from '@/lib/stripe-helpers';

/**
 * POST /api/stripe/portal
 * Create Stripe Customer Portal session
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

  // Verify user is owner/admin of workspace
  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get subscription to find customer ID
  const subscription = await getWorkspaceSubscription(workspaceId);
  if (!subscription.customerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 });
  }

  try {
    const origin = request.headers.get('origin') ?? 'http://localhost:3000';
    const portalSession = await createPortalSession({
      customerId: subscription.customerId,
      returnUrl: `${origin}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
