import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { updateSubscriptionFromStripe } from '@/lib/stripe-helpers';
import {
  markStripeEventFailed,
  markStripeEventProcessed,
  recordStripeEventReceived,
} from '@/db/queries/stripe-events';
import type Stripe from 'stripe';
import { withApiLogging } from '@/lib/logging';
import { badRequest, HttpError } from '@/lib/http';

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 */
export const POST = withApiLogging('api.stripe.webhook', async (request: NextRequest) => {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    throw badRequest('Missing signature');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new HttpError(500, 'Webhook not configured', { expose: true });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    throw badRequest('Invalid signature', err);
  }

  const isNew = await recordStripeEventReceived({ eventId: event.id, type: event.type });
  if (!isNew) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  after(async () => {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as unknown as {
            id: string;
            customer: string;
            status: string;
            items: { data: Array<{ price: { id: string } }> };
            current_period_start: number;
            current_period_end: number;
            cancel_at_period_end: boolean;
            metadata: Record<string, string>;
          };
          await updateSubscriptionFromStripe({
            id: subscription.id,
            customer: subscription.customer,
            status: subscription.status,
            items: subscription.items,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            metadata: subscription.metadata as { workspaceId?: string },
          });
          break;
        }

        // We currently don't need to mutate state for these events. StripeEvents provides an audit trail.
        case 'checkout.session.completed':
        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
        default:
          break;
      }

      await markStripeEventProcessed({ eventId: event.id });
    } catch (e) {
      await markStripeEventFailed({
        eventId: event.id,
        error: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  });

  return NextResponse.json({ received: true, queued: true });
});
