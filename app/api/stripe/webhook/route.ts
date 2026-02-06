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

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
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

          case 'checkout.session.completed': {
            const checkoutSession = event.data.object as Stripe.Checkout.Session;
            console.log('Checkout completed:', checkoutSession.id);
            break;
          }

          case 'invoice.payment_succeeded': {
            const invoice = event.data.object as Stripe.Invoice;
            console.log('Payment succeeded:', invoice.id);
            break;
          }

          case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice;
            console.log('Payment failed:', invoice.id);
            break;
          }

          default:
            console.log(`Unhandled event type: ${event.type}`);
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
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
