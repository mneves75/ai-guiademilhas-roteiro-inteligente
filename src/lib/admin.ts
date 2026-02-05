import { db } from '@/db/client';
import { users, workspaces, subscriptions } from '@/db/schema';
import { count, desc, sql } from 'drizzle-orm';

/**
 * Admin role check - in production, check against a proper admin flag
 */
export function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

/**
 * Get system-wide statistics for admin dashboard
 */
export async function getSystemStats() {
  const [userCount] = await db.select({ count: count() }).from(users);
  const [workspaceCount] = await db
    .select({ count: count() })
    .from(workspaces)
    .where(sql`${workspaces.deletedAt} IS NULL`);
  const [activeSubscriptions] = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(sql`${subscriptions.status} = 'active' AND ${subscriptions.deletedAt} IS NULL`);

  // Users created in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const [newUsers] = await db
    .select({ count: count() })
    .from(users)
    .where(sql`${users.createdAt} > ${sevenDaysAgo}`);

  return {
    totalUsers: userCount?.count ?? 0,
    totalWorkspaces: workspaceCount?.count ?? 0,
    activeSubscriptions: activeSubscriptions?.count ?? 0,
    newUsersLast7Days: newUsers?.count ?? 0,
  };
}

/**
 * Get all users with pagination for admin
 */
export async function getAdminUsers(page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;

  const usersList = await db.query.users.findMany({
    limit: pageSize,
    offset,
    orderBy: [desc(users.createdAt)],
    with: {
      workspaceMemberships: {
        with: {
          workspace: true,
        },
      },
    },
  });

  const [totalCount] = await db.select({ count: count() }).from(users);

  return {
    users: usersList,
    pagination: {
      page,
      pageSize,
      total: totalCount?.count ?? 0,
      totalPages: Math.ceil((totalCount?.count ?? 0) / pageSize),
    },
  };
}

/**
 * Get all workspaces with pagination for admin
 */
export async function getAdminWorkspaces(page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;

  const workspacesList = await db.query.workspaces.findMany({
    limit: pageSize,
    offset,
    orderBy: [desc(workspaces.createdAt)],
    where: sql`${workspaces.deletedAt} IS NULL`,
    with: {
      owner: true,
      members: true,
      subscriptions: true,
    },
  });

  const [totalCount] = await db
    .select({ count: count() })
    .from(workspaces)
    .where(sql`${workspaces.deletedAt} IS NULL`);

  return {
    workspaces: workspacesList,
    pagination: {
      page,
      pageSize,
      total: totalCount?.count ?? 0,
      totalPages: Math.ceil((totalCount?.count ?? 0) / pageSize),
    },
  };
}

/**
 * Get recent activity for admin dashboard
 */
export async function getRecentActivity(limit = 10) {
  // Get recent users
  const recentUsers = await db.query.users.findMany({
    limit,
    orderBy: [desc(users.createdAt)],
  });

  // Get recent workspaces
  const recentWorkspaces = await db.query.workspaces.findMany({
    limit,
    orderBy: [desc(workspaces.createdAt)],
    where: sql`${workspaces.deletedAt} IS NULL`,
    with: {
      owner: true,
    },
  });

  return {
    recentUsers,
    recentWorkspaces,
  };
}
