import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  getWorkspaceMembers,
  verifyWorkspaceMember,
  updateMemberRole,
  softDeleteWorkspaceMember,
} from '@/db/queries/workspaces';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/workspaces/[id]/members
 * List workspace members
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const workspaceId = Number(id);

  // Verify membership
  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
  }

  const members = await getWorkspaceMembers(workspaceId);
  return NextResponse.json({ members });
}

/**
 * PATCH /api/workspaces/[id]/members
 * Update member role (owner/admin only)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
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
  const { userId, role } = body;

  if (!userId || !role) {
    return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
  }

  // Prevent changing owner role (unless you're the owner)
  if (role === 'owner' && membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can transfer ownership' }, { status: 403 });
  }

  // Prevent demoting yourself if you're the owner
  if (userId === session.user.id && membership.role === 'owner' && role !== 'owner') {
    return NextResponse.json({ error: 'Cannot demote yourself as owner' }, { status: 400 });
  }

  const [updated] = await updateMemberRole(workspaceId, userId, role);
  return NextResponse.json({ member: updated });
}

/**
 * DELETE /api/workspaces/[id]/members
 * Remove member from workspace (owner/admin only, or self-leave)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const workspaceId = Number(id);

  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
  }

  // Self-leave is always allowed (except for owner)
  const isSelfLeave = userId === session.user.id;
  if (isSelfLeave) {
    if (membership.role === 'owner') {
      return NextResponse.json(
        { error: 'Owner cannot leave. Transfer ownership first.' },
        { status: 400 }
      );
    }
  } else {
    // Removing others requires owner/admin
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  await softDeleteWorkspaceMember(workspaceId, userId);
  return NextResponse.json({ success: true });
}
