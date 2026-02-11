import { NextResponse, type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { auditFromRequest } from '@/audit';
import { getAuth } from '@/lib/auth';
import { isHttpError } from '@/lib/http';
import { readJsonBodyAs } from '@/lib/http-body';
import { withApiLogging } from '@/lib/logging';
import { normalizeLocale } from '@/lib/locale';
import { getOrCreateRequestId } from '@/lib/request-id';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { generatePlannerReport } from '@/lib/planner/generate-report';
import { PLANNER_API_SCHEMA_VERSION } from '@/lib/planner/api-contract';
import { plannerGenerateRequestSchema } from '@/lib/planner/schema';
import { captureServerEvent } from '@/lib/analytics/posthog-server';
import { plannerFunnelEvents } from '@/lib/analytics/funnel';
import { incPlannerFunnelGenerated } from '@/lib/metrics';

const RATE_LIMIT_MAX = 6;
const RATE_LIMIT_WINDOW_MS = 60_000;

export const runtime = 'nodejs';

function problemJson(options: {
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
    // Backward compatibility for existing clients that only look for `error`.
    error: options.title,
  };

  const headers = new Headers({
    'Content-Type': 'application/problem+json; charset=utf-8',
    'x-request-id': options.requestId,
  });
  if (typeof options.retryAfterSeconds === 'number') {
    headers.set('Retry-After', String(options.retryAfterSeconds));
  }

  return new Response(JSON.stringify(body), { status: options.status, headers });
}

function plannerProblemResponse(options: {
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

export const POST = withApiLogging('api.planner.generate', async (request: NextRequest) => {
  const requestId = getOrCreateRequestId(request);
  const instance = request.nextUrl.pathname;

  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return plannerProblemResponse({
        status: 401,
        requestId,
        instance,
      });
    }

    const rateLimit = await checkRateLimit({
      namespace: 'planner.generate',
      identifier: session.user.id,
      max: RATE_LIMIT_MAX,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    if (!rateLimit.ok) {
      return plannerProblemResponse({
        status: 429,
        requestId,
        instance,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }

    const payload = await readJsonBodyAs(request, plannerGenerateRequestSchema);
    const locale = normalizeLocale(payload.locale);
    const generation = await generatePlannerReport({
      locale,
      preferences: payload.preferences,
    });

    auditFromRequest(request, {
      action: 'planner.generate',
      actor: {
        userId: String(session.user.id),
      },
      metadata: {
        locale,
        passengers:
          payload.preferences.num_adultos +
          payload.preferences.num_chd +
          payload.preferences.num_inf,
        destinationsProvided: payload.preferences.destinos.length > 0,
        generationMode: generation.mode,
        source: payload.source,
      },
    });

    if (payload.source) {
      captureServerEvent({
        distinctId: String(session.user.id),
        event: plannerFunnelEvents.plannerGenerated,
        properties: {
          source: payload.source,
          locale,
          mode: generation.mode,
          channel: 'server',
        },
      });
    }

    incPlannerFunnelGenerated({
      source: payload.source ?? 'unknown',
      mode: generation.mode,
      channel: 'server',
    });

    return NextResponse.json(
      {
        schemaVersion: PLANNER_API_SCHEMA_VERSION,
        generatedAt: new Date().toISOString(),
        report: generation.report,
        mode: generation.mode,
      },
      {
        status: 200,
        headers: {
          'x-request-id': requestId,
        },
      }
    );
  } catch (err) {
    if (isHttpError(err) && err.expose) {
      return plannerProblemResponse({
        status: err.status,
        requestId,
        instance,
        detail: err.message,
      });
    }

    return plannerProblemResponse({
      status: 500,
      requestId,
      instance,
    });
  }
});
