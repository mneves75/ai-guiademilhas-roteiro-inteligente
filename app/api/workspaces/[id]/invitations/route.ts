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
import { isInviteRole } from '@/lib/security/workspace-roles';

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
  if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
    return NextResponse.json({ error: 'Invalid workspace id' }, { status: 400 });
  }

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
  if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
    return NextResponse.json({ error: 'Invalid workspace id' }, { status: 400 });
  }

  // Verify owner/admin
  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email =
    typeof body === 'object' && body !== null && 'email' in body
      ? (body as { email?: unknown }).email
      : undefined;
  const role =
    typeof body === 'object' && body !== null && 'role' in body
      ? (body as { role?: unknown }).role
      : 'member';

  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Validate email format
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  if (!isInviteRole(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Check for existing invitation
  const exists = await hasExistingInvitation(workspaceId, normalizedEmail);
  if (exists) {
    return NextResponse.json(
      { error: 'Invitation already pending for this email' },
      { status: 409 }
    );
  }

  const [invitation] = await createInvitation({
    workspaceId,
    email: normalizedEmail,
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
  if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
    return NextResponse.json({ error: 'Invalid workspace id' }, { status: 400 });
  }

  // Verify owner/admin
  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const invitationId =
    typeof body === 'object' && body !== null && 'invitationId' in body
      ? (body as { invitationId?: unknown }).invitationId
      : undefined;

  if (typeof invitationId !== 'number' || !Number.isFinite(invitationId) || invitationId <= 0) {
    return NextResponse.json({ error: 'invitationId is required' }, { status: 400 });
  }

  await revokeInvitation(invitationId);
  return NextResponse.json({ success: true });
}
