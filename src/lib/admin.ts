import 'server-only';

import { db, users, workspaces, subscriptions } from '@/db/client';
import { and, count, desc, eq, gt, isNull } from 'drizzle-orm';
import { STRIPE_PLANS } from '@/lib/stripe';

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
    .where(isNull(workspaces.deletedAt));
  const [activeSubscriptions] = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(and(eq(subscriptions.status, 'active'), isNull(subscriptions.deletedAt)));

  // Estimated MRR (best-effort: derives from known Stripe price IDs)
  const subs = await db.query.subscriptions.findMany({
    where: (s, { and, eq, isNull }) => and(eq(s.status, 'active'), isNull(s.deletedAt)),
  });
  const estimatedMrrCents = subs.reduce((sum, s) => {
    const priceId = s.stripePriceId ?? '';
    if (!priceId) return sum;
    if (priceId === STRIPE_PLANS.pro.priceIds?.month)
      return sum + (STRIPE_PLANS.pro.priceMonthlyCents ?? 0);
    if (priceId === STRIPE_PLANS.pro.priceIds?.year) {
      const yearly = STRIPE_PLANS.pro.priceYearlyCents ?? 0;
      return sum + Math.round(yearly / 12);
    }
    return sum;
  }, 0);

  // Users created in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const [newUsers] = await db
    .select({ count: count() })
    .from(users)
    .where(gt(users.createdAt, sevenDaysAgo));

  return {
    totalUsers: userCount?.count ?? 0,
    totalWorkspaces: workspaceCount?.count ?? 0,
    activeSubscriptions: activeSubscriptions?.count ?? 0,
    newUsersLast7Days: newUsers?.count ?? 0,
    estimatedMrrCents,
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
    where: isNull(workspaces.deletedAt),
    with: {
      owner: true,
      members: true,
      subscriptions: true,
    },
  });

  const [totalCount] = await db
    .select({ count: count() })
    .from(workspaces)
    .where(isNull(workspaces.deletedAt));

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
 * Get all subscriptions with pagination for admin
 */
export async function getAdminSubscriptions(page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;

  const subs = await db.query.subscriptions.findMany({
    limit: pageSize,
    offset,
    orderBy: [desc(subscriptions.updatedAt)],
    where: isNull(subscriptions.deletedAt),
    with: {
      workspace: true,
    },
  });

  const [totalCount] = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(isNull(subscriptions.deletedAt));

  return {
    subscriptions: subs,
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
    where: isNull(workspaces.deletedAt),
    with: {
      owner: true,
    },
  });

  return {
    recentUsers,
    recentWorkspaces,
  };
}
