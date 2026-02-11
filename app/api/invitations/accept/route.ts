import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { acceptInvitation, getInvitationByToken } from '@/db/queries/invitations';
import { verifyWorkspaceMember } from '@/db/queries/workspaces';
import { withApiLogging } from '@/lib/logging';
import { badRequest, conflict, forbidden, unauthorized } from '@/lib/http';
import { readJsonBodyAs } from '@/lib/http-body';
import { auditFromRequest } from '@/audit';
import { z } from 'zod';

const acceptInvitationSchema = z
  .object({
    token: z.string().regex(/^[a-f0-9]{64}$/i, 'Invalid token format'),
  })
  .strict();

/**
 * POST /api/invitations/accept
 * Accept an invitation using token
 */
export const POST = withApiLogging('api.invitations.accept', async (request: NextRequest) => {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw unauthorized();
  }

  const { token } = await readJsonBodyAs(request, acceptInvitationSchema);

  // Validate invitation exists
  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    throw badRequest('Invalid or expired invitation');
  }

  // Check if user is already a member
  const existingMembership = await verifyWorkspaceMember(invitation.workspaceId, session.user.id);
  if (existingMembership) {
    throw conflict('Already a member of this workspace');
  }

  // Enforce email binding: invitation token alone should not be enough to join a workspace.
  if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
    throw forbidden('Invitation was sent to a different email');
  }

  try {
    const [member] = await acceptInvitation(token, session.user.id);

    auditFromRequest(request, {
      action: 'workspace.invitation.accept',
      actor: {
        userId: String(session.user.id),
      },
      target: { type: 'workspace', id: invitation.workspaceId },
      metadata: { role: invitation.role },
    });

    return NextResponse.json({ member, workspaceId: invitation.workspaceId });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid or expired invitation') {
      throw badRequest('Invalid or expired invitation', error);
    }
    throw error;
  }
});

/**
 * GET /api/invitations/accept?token=xxx
 * Verify invitation token (for preview before accepting)
 */
export const GET = withApiLogging('api.invitations.verify', async (request: NextRequest) => {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    throw badRequest('Token is required');
  }

  if (!/^[a-f0-9]{64}$/i.test(token)) {
    throw badRequest('Invalid token format');
  }

  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    throw badRequest('Invalid or expired invitation');
  }

  // Return limited info (don't expose full invitation details)
  return NextResponse.json({
    workspace: {
      name: invitation.workspace.name,
      slug: invitation.workspace.slug,
    },
    role: invitation.role,
    invitedBy: invitation.invitedBy.name ?? invitation.invitedBy.email,
    expiresAt: invitation.expiresAt,
  });
});
