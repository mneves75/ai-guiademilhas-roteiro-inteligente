import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  getWorkspaceMembers,
  getWorkspaceById,
  verifyWorkspaceMember,
  updateMemberRole,
  softDeleteWorkspaceMember,
} from '@/db/queries/workspaces';
import { isWorkspaceMemberRole } from '@/lib/security/workspace-roles';

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
  if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
    return NextResponse.json({ error: 'Invalid workspace id' }, { status: 400 });
  }

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

  const userId =
    typeof body === 'object' && body !== null && 'userId' in body
      ? (body as { userId?: unknown }).userId
      : undefined;
  const role =
    typeof body === 'object' && body !== null && 'role' in body
      ? (body as { role?: unknown }).role
      : undefined;

  if (typeof userId !== 'string' || !userId || !isWorkspaceMemberRole(role)) {
    return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
  }

  // Keep ownership a single source of truth (workspaces.ownerUserId).
  // If you want ownership transfer, implement an explicit endpoint that updates ownerUserId + roles atomically.
  if (role === 'owner') {
    return NextResponse.json(
      { error: 'Ownership transfer is not supported via role updates' },
      { status: 400 }
    );
  }

  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }
  if (userId === workspace.ownerUserId) {
    return NextResponse.json(
      { error: 'Cannot change the workspace owner role. Transfer ownership first.' },
      { status: 400 }
    );
  }

  // Keep the owner stable (ownerUserId). Owners shouldn't be able to demote themselves via roles.
  if (userId === session.user.id && membership.role === 'owner') {
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
  if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
    return NextResponse.json({ error: 'Invalid workspace id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const userId =
    typeof body === 'object' && body !== null && 'userId' in body
      ? (body as { userId?: unknown }).userId
      : undefined;

  if (typeof userId !== 'string' || !userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
  }

  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  if (userId === workspace.ownerUserId) {
    return NextResponse.json(
      { error: 'Cannot remove the workspace owner. Transfer ownership first.' },
      { status: 400 }
    );
  }

  // Self-leave is always allowed (except for owner)
  const isSelfLeave = userId === session.user.id;
  if (isSelfLeave) {
    if (workspace.ownerUserId === session.user.id || membership.role === 'owner') {
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
