import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getWorkspaceById,
  verifyWorkspaceMember,
  updateWorkspace,
  softDeleteWorkspace,
} from '@/db/queries/workspaces';
import { isUniqueConstraintError } from '@/db/errors';
import { withApiLogging } from '@/lib/logging';
import { badRequest, conflict, forbidden, notFound, unauthorized } from '@/lib/http';
import { readJsonBodyAs } from '@/lib/http-body';
import { z } from 'zod';

type RouteContext = { params: Promise<{ id: string }> };

const updateWorkspaceSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
      .optional(),
  })
  .strict();

/**
 * GET /api/workspaces/[id]
 * Get workspace details
 */
export const GET = withApiLogging(
  'api.workspaces.get',
  async (_request: NextRequest, context: RouteContext) => {
    const session = await getSession();
    if (!session) {
      throw unauthorized();
    }

    const { id } = await context.params;
    const workspaceId = Number(id);
    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      throw badRequest('Invalid workspace id');
    }

    // Verify membership
    const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
    if (!membership) {
      throw forbidden('Not a member of this workspace');
    }

    const workspace = await getWorkspaceById(workspaceId);
    if (!workspace) {
      throw notFound('Workspace not found');
    }

    return NextResponse.json({ workspace, role: membership.role });
  }
);

/**
 * PATCH /api/workspaces/[id]
 * Update workspace (owner/admin only)
 */
export const PATCH = withApiLogging(
  'api.workspaces.update',
  async (request: NextRequest, context: RouteContext) => {
    const session = await getSession();
    if (!session) {
      throw unauthorized();
    }

    const { id } = await context.params;
    const workspaceId = Number(id);
    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      throw badRequest('Invalid workspace id');
    }

    // Verify owner/admin
    const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw forbidden();
    }

    const { name, slug } = await readJsonBodyAs(request, updateWorkspaceSchema);

    try {
      const [updated] = await updateWorkspace(workspaceId, {
        name,
        slug,
      });
      return NextResponse.json({ workspace: updated });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw conflict('Slug already taken', error);
      }
      throw error;
    }
  }
);

/**
 * DELETE /api/workspaces/[id]
 * Soft delete workspace (owner only)
 */
export const DELETE = withApiLogging(
  'api.workspaces.delete',
  async (_request: NextRequest, context: RouteContext) => {
    const session = await getSession();
    if (!session) {
      throw unauthorized();
    }

    const { id } = await context.params;
    const workspaceId = Number(id);
    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      throw badRequest('Invalid workspace id');
    }

    // Verify owner
    const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
    if (!membership || membership.role !== 'owner') {
      throw forbidden('Only owner can delete workspace');
    }

    await softDeleteWorkspace(workspaceId);
    return NextResponse.json({ success: true });
  }
);
