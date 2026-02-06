import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  getWorkspaceById,
  verifyWorkspaceMember,
  updateWorkspace,
  softDeleteWorkspace,
} from '@/db/queries/workspaces';
import { isUniqueConstraintError } from '@/db/errors';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/workspaces/[id]
 * Get workspace details
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

  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  return NextResponse.json({ workspace, role: membership.role });
}

/**
 * PATCH /api/workspaces/[id]
 * Update workspace (owner/admin only)
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
  const { name, slug } = body;

  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
      { status: 400 }
    );
  }

  try {
    const [updated] = await updateWorkspace(workspaceId, { name, slug });
    return NextResponse.json({ workspace: updated });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
    }
    throw error;
  }
}

/**
 * DELETE /api/workspaces/[id]
 * Soft delete workspace (owner only)
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const workspaceId = Number(id);

  // Verify owner
  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can delete workspace' }, { status: 403 });
  }

  await softDeleteWorkspace(workspaceId);
  return NextResponse.json({ success: true });
}
