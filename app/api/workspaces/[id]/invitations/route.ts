import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
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
import { INVITE_ROLES } from '@/lib/security/workspace-roles';
import { withApiLogging } from '@/lib/logging';
import { badRequest, conflict, forbidden, notFound, HttpError, unauthorized } from '@/lib/http';
import { readJsonBodyAs } from '@/lib/http-body';
import { z } from 'zod';

type RouteContext = { params: Promise<{ id: string }> };

const createInvitationSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .transform((value) => value.toLowerCase()),
    role: z.enum(INVITE_ROLES).default('member'),
  })
  .strict();

const revokeInvitationSchema = z
  .object({
    invitationId: z.coerce.number().int().positive(),
  })
  .strict();

/**
 * GET /api/workspaces/[id]/invitations
 * List pending invitations (owner/admin only)
 */
export const GET = withApiLogging(
  'api.workspaces.invitations.list',
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

    // Verify owner/admin
    const membership = await verifyWorkspaceMember(workspaceId, session.user.id);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw forbidden();
    }

    const invitations = await getWorkspaceInvitations(workspaceId);
    return NextResponse.json({ invitations });
  }
);

/**
 * POST /api/workspaces/[id]/invitations
 * Create new invitation (owner/admin only)
 */
export const POST = withApiLogging(
  'api.workspaces.invitations.create',
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

    const { email: normalizedEmail, role } = await readJsonBodyAs(request, createInvitationSchema);

    // Extra defense: keep runtime type guard for future refactors.
    if (!isInviteRole(role)) throw badRequest('Invalid role');

    // Check for existing invitation
    const exists = await hasExistingInvitation(workspaceId, normalizedEmail);
    if (exists) {
      throw conflict('Invitation already pending for this email');
    }

    const [invitation] = await createInvitation({
      workspaceId,
      email: normalizedEmail,
      role,
      invitedByUserId: session.user.id,
    });
    if (!invitation) {
      throw new Error('createInvitation returned no invitation');
    }

    const workspace = await getWorkspaceById(workspaceId);
    if (!workspace) {
      await revokeInvitation(invitation.id);
      throw notFound('Workspace not found');
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
      throw new HttpError(500, 'Failed to send invitation email');
    }

    return NextResponse.json(
      { invitation, email: { success: true, id: emailResult.id } },
      { status: 201 }
    );
  }
);

/**
 * DELETE /api/workspaces/[id]/invitations
 * Revoke invitation (owner/admin only)
 */
export const DELETE = withApiLogging(
  'api.workspaces.invitations.revoke',
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

    const { invitationId } = await readJsonBodyAs(request, revokeInvitationSchema);

    await revokeInvitation(invitationId);
    return NextResponse.json({ success: true });
  }
);
