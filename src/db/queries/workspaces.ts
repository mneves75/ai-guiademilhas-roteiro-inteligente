import { db } from '@/db/client';
import { workspaces, workspaceMembers, subscriptions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { withSoftDeleteFilter } from './base';

/**
 * Get workspace by ID (soft delete safe)
 */
export async function getWorkspaceById(id: number) {
  return db.query.workspaces.findFirst({
    where: (ws, { eq, and }) => and(eq(ws.id, id), withSoftDeleteFilter(ws)),
    with: {
      owner: true,
      members: true,
      subscriptions: true,
    },
  });
}

/**
 * Get all workspaces for a user
 */
export async function getUserWorkspaces(userId: string) {
  return db.query.workspaceMembers.findMany({
    where: (members, { eq, and }) => and(eq(members.userId, userId), withSoftDeleteFilter(members)),
    with: {
      workspace: true,
    },
  });
}

/**
 * Get workspace members (all roles)
 */
export async function getWorkspaceMembers(workspaceId: number) {
  return db.query.workspaceMembers.findMany({
    where: (members, { eq, and }) =>
      and(eq(members.workspaceId, workspaceId), withSoftDeleteFilter(members)),
    with: {
      user: true,
    },
  });
}

/**
 * Verify user is member of workspace
 */
export async function verifyWorkspaceMember(workspaceId: number, userId: string) {
  return db.query.workspaceMembers.findFirst({
    where: (members, { eq, and }) =>
      and(
        eq(members.workspaceId, workspaceId),
        eq(members.userId, userId),
        withSoftDeleteFilter(members)
      ),
  });
}

/**
 * Create workspace
 */
export async function createWorkspace(data: { name: string; slug: string; ownerUserId: string }) {
  return db
    .insert(workspaces)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
}

/**
 * Add user to workspace
 */
export async function addWorkspaceMember(data: {
  workspaceId: number;
  userId: string;
  role?: string;
}) {
  return db
    .insert(workspaceMembers)
    .values({
      ...data,
      role: data.role ?? 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
}

/**
 * Soft delete workspace member
 */
export async function softDeleteWorkspaceMember(workspaceId: number, userId: string) {
  return db
    .update(workspaceMembers)
    .set({ deletedAt: new Date() })
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)));
}

/**
 * Soft delete workspace with cascade
 */
export async function softDeleteWorkspace(workspaceId: number) {
  const now = new Date();

  await db.update(workspaces).set({ deletedAt: now }).where(eq(workspaces.id, workspaceId));

  await db
    .update(workspaceMembers)
    .set({ deletedAt: now })
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  await db
    .update(subscriptions)
    .set({ deletedAt: now })
    .where(eq(subscriptions.workspaceId, workspaceId));
}

/**
 * Restore soft-deleted workspace
 */
export async function restoreWorkspace(workspaceId: number) {
  await db.update(workspaces).set({ deletedAt: null }).where(eq(workspaces.id, workspaceId));

  await db
    .update(workspaceMembers)
    .set({ deletedAt: null })
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  await db
    .update(subscriptions)
    .set({ deletedAt: null })
    .where(eq(subscriptions.workspaceId, workspaceId));
}

/**
 * Update workspace
 */
export async function updateWorkspace(id: number, data: { name?: string; slug?: string }) {
  return db
    .update(workspaces)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(workspaces.id, id))
    .returning();
}

/**
 * Change member role
 */
export async function updateMemberRole(workspaceId: number, userId: string, role: string) {
  return db
    .update(workspaceMembers)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .returning();
}
