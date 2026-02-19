import 'server-only';

import type { PlannerStreamEvent } from './types';

const encoder = new TextEncoder();

/** Standard SSE headers used by all planner streaming endpoints. */
export function sseHeaders(requestId: string, extra?: Record<string, string>): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-store',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'x-request-id': requestId,
    ...extra,
  };
}

/** Encode a PlannerStreamEvent as an SSE data frame. */
export function encodeEvent(event: PlannerStreamEvent): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

/** Create a ReadableStream that emits a single SSE event and closes. */
export function singleEventResponse(
  event: PlannerStreamEvent,
  requestId: string,
  extra?: Record<string, string>
): Response {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encodeEvent(event));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: sseHeaders(requestId, extra),
  });
}
