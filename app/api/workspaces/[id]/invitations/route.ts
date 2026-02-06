import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyWorkspaceMember } from '@/db/queries/workspaces';
import { getWorkspaceById } from '@/db/queries/workspaces';
import {
  createInvitation,
  getWorkspaceInvitations,
  revokeInvitation,
  hasExistingInvitation,
} from '@/db/queries/invitations';
import { sendInvitationEmail } from '@/lib/email-actions';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/workspaces/[id]/invitations
 * List pending invitations (owner/admin only)
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const workspaceId = Number(id);

  // Verify owner/admin
  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const invitations = await getWorkspaceInvitations(workspaceId);
  return NextResponse.json({ invitations });
}

/**
 * POST /api/workspaces/[id]/invitations
 * Create new invitation (owner/admin only)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const workspaceId = Number(id);

  // Verify owner/admin
  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { email, role = 'member' } = body;

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  // Check for existing invitation
  const exists = await hasExistingInvitation(workspaceId, email);
  if (exists) {
    return NextResponse.json(
      { error: 'Invitation already pending for this email' },
      { status: 409 }
    );
  }

  const [invitation] = await createInvitation({
    workspaceId,
    email,
    role,
    invitedByUserId: session.user.id,
  });
  if (!invitation) {
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }

  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) {
    await revokeInvitation(invitation.id);
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const inviterName = session.user.name ?? session.user.email;
  const emailResult = await sendInvitationEmail({
    to: invitation.email,
    inviterName,
    workspaceName: workspace.name,
    role: invitation.role,
    token: invitation.token,
    expiresAt: invitation.expiresAt,
  });

  if (!emailResult.success) {
    await revokeInvitation(invitation.id);
    return NextResponse.json(
      { error: emailResult.error ?? 'Failed to send invitation email' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { invitation, email: { success: true, id: emailResult.id } },
    { status: 201 }
  );
}

/**
 * DELETE /api/workspaces/[id]/invitations
 * Revoke invitation (owner/admin only)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const workspaceId = Number(id);

  // Verify owner/admin
  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { invitationId } = body;

  if (!invitationId) {
    return NextResponse.json({ error: 'invitationId is required' }, { status: 400 });
  }

  await revokeInvitation(invitationId);
  return NextResponse.json({ success: true });
}
