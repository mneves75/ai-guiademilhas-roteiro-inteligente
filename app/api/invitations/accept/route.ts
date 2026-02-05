import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { acceptInvitation, getInvitationByToken } from '@/db/queries/invitations';
import { verifyWorkspaceMember } from '@/db/queries/workspaces';

/**
 * POST /api/invitations/accept
 * Accept an invitation using token
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  // Validate invitation exists
  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 });
  }

  // Check if user is already a member
  const existingMembership = await verifyWorkspaceMember(invitation.workspaceId, session.user.id);
  if (existingMembership) {
    return NextResponse.json({ error: 'Already a member of this workspace' }, { status: 409 });
  }

  // Check email matches (optional - can be disabled for flexibility)
  // if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
  //   return NextResponse.json({ error: 'Invitation was sent to a different email' }, { status: 403 });
  // }

  const [member] = await acceptInvitation(token, session.user.id);
  return NextResponse.json({ member, workspaceId: invitation.workspaceId });
}

/**
 * GET /api/invitations/accept?token=xxx
 * Verify invitation token (for preview before accepting)
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 });
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
}
