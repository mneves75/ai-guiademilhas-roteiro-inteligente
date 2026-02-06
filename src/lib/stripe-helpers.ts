import { getStripe, STRIPE_PLANS, type PlanId } from './stripe';
import { db, subscriptions } from '@/db/client';
import { eq } from 'drizzle-orm';

/**
 * Create or get Stripe customer for a workspace
 */
export async function getOrCreateStripeCustomer(
  workspaceId: number,
  email: string,
  name?: string
): Promise<string> {
  const stripe = getStripe();

  // Check if customer already exists
  const subscription = await db.query.subscriptions.findFirst({
    where: (sub, { eq, isNull }) => eq(sub.workspaceId, workspaceId) && isNull(sub.deletedAt),
  });

  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId;
  }

  // Get workspace for metadata
  const workspace = await db.query.workspaces.findFirst({
    where: (ws, { eq }) => eq(ws.id, workspaceId),
  });

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name: name ?? workspace?.name,
    metadata: {
      workspaceId: workspaceId.toString(),
    },
  });

  // Create or update subscription record
  if (subscription) {
    await db
      .update(subscriptions)
      .set({
        stripeCustomerId: customer.id,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));
  } else {
    await db.insert(subscriptions).values({
      workspaceId,
      stripeCustomerId: customer.id,
      status: 'incomplete',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return customer.id;
}

/**
 * Create Stripe Checkout session for subscription
 */
export async function createCheckoutSession({
  workspaceId,
  priceId,
  customerId,
  successUrl,
  cancelUrl,
}: {
  workspaceId: number;
  priceId: string;
  customerId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        workspaceId: workspaceId.toString(),
      },
    },
    metadata: {
      workspaceId: workspaceId.toString(),
    },
  });

  return session;
}

/**
 * Create Stripe Customer Portal session
 */
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get subscription status for a workspace
 */
export async function getWorkspaceSubscription(workspaceId: number) {
  const subscription = await db.query.subscriptions.findFirst({
    where: (sub, { eq, isNull }) => eq(sub.workspaceId, workspaceId) && isNull(sub.deletedAt),
  });

  if (!subscription) {
    return { plan: 'free' as PlanId, status: 'active' };
  }

  // Determine plan from price ID
  let plan: PlanId = 'free';
  if (subscription.stripePriceId === STRIPE_PLANS.pro.priceId) {
    plan = 'pro';
  } else if (subscription.stripePriceId === STRIPE_PLANS.enterprise.priceId) {
    plan = 'enterprise';
  }

  return {
    plan,
    status: subscription.status,
    customerId: subscription.stripeCustomerId,
    subscriptionId: subscription.stripeSubscriptionId,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  };
}

/**
 * Update subscription from Stripe webhook
 */
export async function updateSubscriptionFromStripe(stripeSubscription: {
  id: string;
  customer: string;
  status: string;
  items: { data: Array<{ price: { id: string } }> };
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  metadata: { workspaceId?: string };
}) {
  const workspaceId = stripeSubscription.metadata.workspaceId
    ? parseInt(stripeSubscription.metadata.workspaceId)
    : null;

  if (!workspaceId) {
    console.error('No workspaceId in subscription metadata');
    return;
  }

  const priceId = stripeSubscription.items.data[0]?.price.id;

  await db
    .update(subscriptions)
    .set({
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.workspaceId, workspaceId));
}
