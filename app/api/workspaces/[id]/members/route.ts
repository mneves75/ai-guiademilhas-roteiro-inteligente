import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getWorkspaceMembers,
  getWorkspaceById,
  verifyWorkspaceMember,
  updateMemberRole,
  softDeleteWorkspaceMember,
} from '@/db/queries/workspaces';
import { isWorkspaceMemberRole } from '@/lib/security/workspace-roles';
import { withApiLogging } from '@/lib/logging';
import { badRequest, forbidden, notFound, unauthorized } from '@/lib/http';
import { readJsonBodyAs } from '@/lib/http-body';
import { WORKSPACE_MEMBER_ROLES } from '@/lib/security/workspace-roles';
import { z } from 'zod';

type RouteContext = { params: Promise<{ id: string }> };

const updateMemberRoleSchema = z
  .object({
    userId: z.string().trim().min(1).max(200),
    role: z.enum(WORKSPACE_MEMBER_ROLES),
  })
  .strict();

const removeMemberSchema = z
  .object({
    userId: z.string().trim().min(1).max(200),
  })
  .strict();

/**
 * GET /api/workspaces/[id]/members
 * List workspace members
 */
export const GET = withApiLogging(
  'api.workspaces.members.list',
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

    const members = await getWorkspaceMembers(workspaceId);
    return NextResponse.json({ members });
  }
);

/**
 * PATCH /api/workspaces/[id]/members
 * Update member role (owner/admin only)
 */
export const PATCH = withApiLogging(
  'api.workspaces.members.update_role',
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

    const { userId, role } = await readJsonBodyAs(request, updateMemberRoleSchema);

    // Extra defense: keep runtime type guard for future refactors.
    if (!isWorkspaceMemberRole(role)) throw badRequest('Invalid role');

    // Keep ownership a single source of truth (workspaces.ownerUserId).
    // If you want ownership transfer, implement an explicit endpoint that updates ownerUserId + roles atomically.
    if (role === 'owner') {
      throw badRequest('Ownership transfer is not supported via role updates');
    }

    const workspace = await getWorkspaceById(workspaceId);
    if (!workspace) {
      throw notFound('Workspace not found');
    }
    if (userId === workspace.ownerUserId) {
      throw badRequest('Cannot change the workspace owner role. Transfer ownership first.');
    }

    // Keep the owner stable (ownerUserId). Owners shouldn't be able to demote themselves via roles.
    if (userId === session.user.id && membership.role === 'owner') {
      throw badRequest('Cannot demote yourself as owner');
    }

    const [updated] = await updateMemberRole(workspaceId, userId, role);
    return NextResponse.json({ member: updated });
  }
);

/**
 * DELETE /api/workspaces/[id]/members
 * Remove member from workspace (owner/admin only, or self-leave)
 */
export const DELETE = withApiLogging(
  'api.workspaces.members.remove',
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

    const { userId } = await readJsonBodyAs(request, removeMemberSchema);

    const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
    if (!membership) {
      throw forbidden('Not a member of this workspace');
    }

    const workspace = await getWorkspaceById(workspaceId);
    if (!workspace) {
      throw notFound('Workspace not found');
    }

    if (userId === workspace.ownerUserId) {
      throw badRequest('Cannot remove the workspace owner. Transfer ownership first.');
    }

    // Self-leave is always allowed (except for owner)
    const isSelfLeave = userId === session.user.id;
    if (isSelfLeave) {
      if (workspace.ownerUserId === session.user.id || membership.role === 'owner') {
        throw badRequest('Owner cannot leave. Transfer ownership first.');
      }
    } else {
      // Removing others requires owner/admin
      if (!['owner', 'admin'].includes(membership.role)) {
        throw forbidden();
      }
    }

    await softDeleteWorkspaceMember(workspaceId, userId);
    return NextResponse.json({ success: true });
  }
);
