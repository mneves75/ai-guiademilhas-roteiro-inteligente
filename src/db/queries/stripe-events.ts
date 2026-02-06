import { db, stripeEvents } from '@/db/client';
import { eq } from 'drizzle-orm';
import { isUniqueConstraintError } from '@/db/errors';

export async function recordStripeEventReceived(params: { eventId: string; type: string }) {
  try {
    await db.insert(stripeEvents).values({
      stripeEventId: params.eventId,
      type: params.type,
      status: 'received',
      receivedAt: new Date(),
    });
    return true;
  } catch (err) {
    if (isUniqueConstraintError(err)) return false;
    throw err;
  }
}

export async function markStripeEventProcessed(params: { eventId: string }) {
  await db
    .update(stripeEvents)
    .set({
      status: 'processed',
      processedAt: new Date(),
      error: null,
    })
    .where(eq(stripeEvents.stripeEventId, params.eventId));
}

export async function markStripeEventFailed(params: { eventId: string; error: string }) {
  await db
    .update(stripeEvents)
    .set({
      status: 'failed',
      processedAt: new Date(),
      error: params.error,
    })
    .where(eq(stripeEvents.stripeEventId, params.eventId));
}
