import 'server-only';

/**
 * Creates a Problem JSON response (RFC 9457) for planner API errors.
 *
 * @param options - Problem details including status, title, detail, etc.
 * @returns Response with application/problem+json content type
 */
export function problemJson(options: {
  status: number;
  title: string;
  detail: string;
  type: string;
  instance: string;
  requestId: string;
  code: string;
  retryAfterSeconds?: number;
}): Response {
  const body = {
    type: options.type,
    title: options.title,
    status: options.status,
    detail: options.detail,
    instance: options.instance,
    requestId: options.requestId,
    code: options.code,
    retryAfterSeconds: options.retryAfterSeconds,
    error: options.title,
  };

  const responseHeaders = new Headers({
    'Content-Type': 'application/problem+json; charset=utf-8',
    'x-request-id': options.requestId,
  });
  if (typeof options.retryAfterSeconds === 'number') {
    responseHeaders.set('Retry-After', String(options.retryAfterSeconds));
  }

  return new Response(JSON.stringify(body), { status: options.status, headers: responseHeaders });
}

/**
 * Maps common planner API status codes to standardized Problem JSON responses.
 *
 * @param options - Status code, request metadata, and optional detail/retryAfter
 * @returns Problem JSON response for 400/401/429/500 status codes
 */
export function plannerProblemResponse(options: {
  status: number;
  requestId: string;
  instance: string;
  detail?: string;
  retryAfterSeconds?: number;
}): Response {
  if (options.status === 400) {
    return problemJson({
      status: 400,
      title: 'Invalid Request',
      detail: options.detail ?? 'Invalid request body.',
      type: 'https://guiademilhas.app/problems/planner-invalid-request',
      instance: options.instance,
      requestId: options.requestId,
      code: 'planner_invalid_request',
    });
  }

  if (options.status === 401) {
    return problemJson({
      status: 401,
      title: 'Unauthorized',
      detail: options.detail ?? 'Authentication is required to generate planner reports.',
      type: 'https://guiademilhas.app/problems/planner-unauthorized',
      instance: options.instance,
      requestId: options.requestId,
      code: 'planner_unauthorized',
    });
  }

  if (options.status === 429) {
    return problemJson({
      status: 429,
      title: 'Too Many Requests',
      detail:
        options.detail ??
        'Rate limit exceeded for planner generation. Retry after the informed interval.',
      type: 'https://guiademilhas.app/problems/planner-rate-limit',
      instance: options.instance,
      requestId: options.requestId,
      code: 'planner_rate_limited',
      retryAfterSeconds: options.retryAfterSeconds,
    });
  }

  return problemJson({
    status: 500,
    title: 'Internal Server Error',
    detail: options.detail ?? 'Unexpected error while generating planner report.',
    type: 'https://guiademilhas.app/problems/planner-internal-error',
    instance: options.instance,
    requestId: options.requestId,
    code: 'planner_internal_error',
  });
}
