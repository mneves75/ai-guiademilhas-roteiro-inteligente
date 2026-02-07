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
  if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
    return NextResponse.json({ error: 'Invalid workspace id' }, { status: 400 });
  }

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

  const name =
    typeof body === 'object' && body !== null && 'name' in body
      ? (body as { name?: unknown }).name
      : undefined;
  const slug =
    typeof body === 'object' && body !== null && 'slug' in body
      ? (body as { slug?: unknown }).slug
      : undefined;

  if (name !== undefined && typeof name !== 'string') {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  }
  if (slug !== undefined && typeof slug !== 'string') {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const trimmedName = typeof name === 'string' ? name.trim() : undefined;
  const trimmedSlug = typeof slug === 'string' ? slug.trim() : undefined;

  if (trimmedSlug && !/^[a-z0-9-]+$/.test(trimmedSlug)) {
    return NextResponse.json(
      { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
      { status: 400 }
    );
  }

  try {
    const [updated] = await updateWorkspace(workspaceId, { name: trimmedName, slug: trimmedSlug });
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
  if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
    return NextResponse.json({ error: 'Invalid workspace id' }, { status: 400 });
  }

  // Verify owner
  const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can delete workspace' }, { status: 403 });
  }

  await softDeleteWorkspace(workspaceId);
  return NextResponse.json({ success: true });
}
