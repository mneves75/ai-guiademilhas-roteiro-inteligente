import { NextResponse, type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { auditFromRequest } from '@/audit';
import { getAuth } from '@/lib/auth';
import { unauthorized } from '@/lib/http';
import { readJsonBodyAs } from '@/lib/http-body';
import { withApiLogging } from '@/lib/logging';
import { normalizeLocale } from '@/lib/locale';
import { getOrCreateRequestId } from '@/lib/request-id';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { generatePlannerReport } from '@/lib/planner/generate-report';
import { PLANNER_API_SCHEMA_VERSION } from '@/lib/planner/api-contract';
import { plannerGenerateRequestSchema } from '@/lib/planner/schema';

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

export const POST = withApiLogging('api.planner.generate', async (request: NextRequest) => {
  const requestId = getOrCreateRequestId(request);
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw unauthorized();
  }

  const rateLimit = await checkRateLimit({
    namespace: 'planner.generate',
    identifier: session.user.id,
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimit.ok) {
    return problemJson({
      status: 429,
      title: 'Too Many Requests',
      detail: 'Rate limit exceeded for planner generation. Retry after the informed interval.',
      type: 'https://guiademilhas.app/problems/planner-rate-limit',
      instance: request.nextUrl.pathname,
      requestId,
      code: 'planner_rate_limited',
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
        payload.preferences.num_adultos + payload.preferences.num_chd + payload.preferences.num_inf,
      destinationsProvided: payload.preferences.destinos.length > 0,
      generationMode: generation.mode,
    },
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
});
