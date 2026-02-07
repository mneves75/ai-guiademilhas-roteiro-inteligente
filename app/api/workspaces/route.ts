import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getUserWorkspaces, createWorkspace, addWorkspaceMember } from '@/db/queries/workspaces';
import { isUniqueConstraintError } from '@/db/errors';

/**
 * GET /api/workspaces
 * List all workspaces for current user
 */
export async function GET() {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const memberships = await getUserWorkspaces(session.user.id);
  const workspaces = memberships.map((m) => ({
    workspace: m.workspace,
    role: m.role,
  }));

  return NextResponse.json({ workspaces });
}

/**
 * POST /api/workspaces
 * Create a new workspace
 */
export async function POST(request: NextRequest) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  if (typeof name !== 'string' || typeof slug !== 'string') {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
  }

  const trimmedName = name.trim();
  const trimmedSlug = slug.trim();
  if (!trimmedName || !trimmedSlug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(trimmedSlug)) {
    return NextResponse.json(
      { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
      { status: 400 }
    );
  }

  try {
    // Create workspace
    const result = await createWorkspace({
      name: trimmedName,
      slug: trimmedSlug,
      ownerUserId: session.user.id,
    });
    const workspace = result[0];

    if (!workspace) {
      return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
    }

    // Add creator as owner member
    await addWorkspaceMember({
      workspaceId: workspace.id,
      userId: session.user.id,
      role: 'owner',
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    // Handle unique constraint violation
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
    }
    throw error;
  }
}
