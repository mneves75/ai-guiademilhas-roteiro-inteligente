import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserWorkspaces, createWorkspace, addWorkspaceMember } from '@/db/queries/workspaces';
import { isUniqueConstraintError } from '@/db/errors';
import { withApiLogging } from '@/lib/logging';
import { conflict, unauthorized } from '@/lib/http';
import { readJsonBodyAs } from '@/lib/http-body';
import { auditFromRequest } from '@/audit';
import { z } from 'zod';

const createWorkspaceSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  })
  .strict();

/**
 * GET /api/workspaces
 * List all workspaces for current user
 */
export const GET = withApiLogging('api.workspaces.list', async (_request: NextRequest) => {
  const session = await getSession();
  if (!session) {
    throw unauthorized();
  }

  const memberships = await getUserWorkspaces(session.user.id);
  const workspaces = memberships.map((m) => ({
    workspace: m.workspace,
    role: m.role,
  }));

  return NextResponse.json({ workspaces });
});

/**
 * POST /api/workspaces
 * Create a new workspace
 */
export const POST = withApiLogging('api.workspaces.create', async (request: NextRequest) => {
  const session = await getSession();
  if (!session) {
    throw unauthorized();
  }

  const { name, slug } = await readJsonBodyAs(request, createWorkspaceSchema);

  try {
    // Create workspace
    const result = await createWorkspace({
      name,
      slug,
      ownerUserId: session.user.id,
    });
    const workspace = result[0];

    if (!workspace) {
      throw new Error('createWorkspace returned no workspace');
    }

    // Add creator as owner member
    await addWorkspaceMember({
      workspaceId: workspace.id,
      userId: session.user.id,
      role: 'owner',
    });

    auditFromRequest(request, {
      action: 'workspace.create',
      actor: {
        userId: String(session.user.id),
      },
      target: { type: 'workspace', id: workspace.id },
      metadata: { slug: workspace.slug },
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    // Handle unique constraint violation
    if (isUniqueConstraintError(error)) {
      throw conflict('Slug already taken', error);
    }
    throw error;
  }
});
