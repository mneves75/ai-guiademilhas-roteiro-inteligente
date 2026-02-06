import { db, subscriptions } from '@/db/client';
import { desc, eq } from 'drizzle-orm';
import { withSoftDeleteFilter } from './base';

/**
 * Get subscription by workspace ID
 */
export async function getWorkspaceSubscription(workspaceId: number) {
  return db.query.subscriptions.findFirst({
    where: (subs, { eq, and }) =>
      and(eq(subs.workspaceId, workspaceId), withSoftDeleteFilter(subs)),
    with: {
      workspace: true,
    },
  });
}

/**
 * Get subscription by Stripe subscription ID
 */
export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  return db.query.subscriptions.findFirst({
    where: (subs, { eq, and }) =>
      and(eq(subs.stripeSubscriptionId, stripeSubscriptionId), withSoftDeleteFilter(subs)),
    with: {
      workspace: true,
    },
  });
}

/**
 * Get subscription by Stripe customer ID
 */
export async function getSubscriptionByStripeCustomerId(stripeCustomerId: string) {
  return db.query.subscriptions.findFirst({
    where: (subs, { eq, and }) =>
      and(eq(subs.stripeCustomerId, stripeCustomerId), withSoftDeleteFilter(subs)),
  });
}

/**
 * Create subscription
 */
export async function createSubscription(data: {
  workspaceId: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  status?: string;
}) {
  await db.insert(subscriptions).values({
    ...data,
    status: data.status ?? 'incomplete',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, data.workspaceId))
    .orderBy(desc(subscriptions.id))
    .limit(1);
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  workspaceId: number,
  data: {
    status?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
  }
) {
  await db
    .update(subscriptions)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.workspaceId, workspaceId));

  return db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, workspaceId))
    .orderBy(desc(subscriptions.id))
    .limit(1);
}

/**
 * Soft delete subscription
 */
export async function softDeleteSubscription(workspaceId: number) {
  await db
    .update(subscriptions)
    .set({
      deletedAt: new Date(),
      status: 'canceled',
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.workspaceId, workspaceId));

  return db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, workspaceId))
    .orderBy(desc(subscriptions.id))
    .limit(1);
}

/**
 * Get all active subscriptions
 */
export async function getActiveSubscriptions() {
  return db.query.subscriptions.findMany({
    where: (subs) => withSoftDeleteFilter(subs),
    with: {
      workspace: true,
    },
  });
}
