import { db, workspaceInvitations, workspaceMembers } from '@/db/client';
import { and, eq } from 'drizzle-orm';
import { withSoftDeleteFilter } from './base';
import crypto from 'crypto';

/**
 * Generate secure invitation token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create workspace invitation
 */
export async function createInvitation(data: {
  workspaceId: number;
  email: string;
  role?: string;
  invitedByUserId: string;
  expiresInDays?: number;
}) {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays ?? 7));

  await db.insert(workspaceInvitations).values({
    workspaceId: data.workspaceId,
    email: data.email.toLowerCase(),
    role: data.role ?? 'member',
    token,
    invitedByUserId: data.invitedByUserId,
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return db
    .select()
    .from(workspaceInvitations)
    .where(eq(workspaceInvitations.token, token))
    .limit(1);
}

/**
 * Get invitation by token (validates not expired)
 */
export async function getInvitationByToken(token: string) {
  return db.query.workspaceInvitations.findFirst({
    where: (inv, { eq, and, gt, isNull }) =>
      and(
        eq(inv.token, token),
        gt(inv.expiresAt, new Date()),
        isNull(inv.acceptedAt),
        withSoftDeleteFilter(inv)
      ),
    with: {
      workspace: true,
      invitedBy: true,
    },
  });
}

/**
 * Get pending invitations for a workspace
 */
export async function getWorkspaceInvitations(workspaceId: number) {
  return db.query.workspaceInvitations.findMany({
    where: (inv, { eq, and, gt, isNull }) =>
      and(
        eq(inv.workspaceId, workspaceId),
        gt(inv.expiresAt, new Date()),
        isNull(inv.acceptedAt),
        withSoftDeleteFilter(inv)
      ),
    with: {
      invitedBy: true,
    },
  });
}

/**
 * Get pending invitations for an email
 */
export async function getInvitationsForEmail(email: string) {
  return db.query.workspaceInvitations.findMany({
    where: (inv, { eq, and, gt, isNull }) =>
      and(
        eq(inv.email, email.toLowerCase()),
        gt(inv.expiresAt, new Date()),
        isNull(inv.acceptedAt),
        withSoftDeleteFilter(inv)
      ),
    with: {
      workspace: true,
      invitedBy: true,
    },
  });
}

/**
 * Accept invitation and add user to workspace
 */
export async function acceptInvitation(token: string, userId: string) {
  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    throw new Error('Invalid or expired invitation');
  }

  // Mark invitation as accepted
  await db
    .update(workspaceInvitations)
    .set({
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(workspaceInvitations.token, token));

  // Add user to workspace
  await db.insert(workspaceMembers).values({
    workspaceId: invitation.workspaceId,
    userId,
    role: invitation.role,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, invitation.workspaceId),
        eq(workspaceMembers.userId, userId)
      )
    )
    .limit(1);
}

/**
 * Revoke (soft delete) an invitation
 */
export async function revokeInvitation(invitationId: number) {
  return db
    .update(workspaceInvitations)
    .set({ deletedAt: new Date() })
    .where(eq(workspaceInvitations.id, invitationId));
}

/**
 * Check if email already has pending invitation for workspace
 */
export async function hasExistingInvitation(workspaceId: number, email: string) {
  const existing = await db.query.workspaceInvitations.findFirst({
    where: (inv, { eq, and, gt, isNull }) =>
      and(
        eq(inv.workspaceId, workspaceId),
        eq(inv.email, email.toLowerCase()),
        gt(inv.expiresAt, new Date()),
        isNull(inv.acceptedAt),
        withSoftDeleteFilter(inv)
      ),
  });
  return !!existing;
}
