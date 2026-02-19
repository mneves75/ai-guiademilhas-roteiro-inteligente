import { NextResponse, type NextRequest } from 'next/server';
import { auditFromRequest } from '@/audit';
import { getSession } from '@/lib/auth';
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
import { plannerProblemResponse } from '@/lib/planner/problem-response';
import { runPostGeneration } from '@/lib/planner/post-generation';

const RATE_LIMIT_MAX = 6;
const RATE_LIMIT_WINDOW_MS = 60_000;

export const runtime = 'nodejs';

export const POST = withApiLogging('api.planner.generate', async (request: NextRequest) => {
  const requestId = getOrCreateRequestId(request);
  const instance = request.nextUrl.pathname;

  try {
    const session = await getSession();
    if (!session) {
      return plannerProblemResponse({ status: 401, requestId, instance });
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

    const { hashPreferences, getCachedReport } = await import('@/lib/planner/cache');
    const cacheHash = await hashPreferences(payload.preferences);
    const cachedReport = await getCachedReport(cacheHash);

    const passengers =
      payload.preferences.num_adultos + payload.preferences.num_chd + payload.preferences.num_inf;

    if (cachedReport) {
      auditFromRequest(request, {
        action: 'planner.generate',
        actor: { userId: String(session.user.id) },
        metadata: {
          locale,
          passengers,
          destinationsProvided: payload.preferences.destinos.length > 0,
          generationMode: 'cached',
          source: payload.source,
        },
      });

      if (payload.source) {
        captureServerEvent({
          distinctId: String(session.user.id),
          event: plannerFunnelEvents.plannerGenerated,
          properties: { source: payload.source, locale, mode: 'cached', channel: 'server' },
        });
      }

      incPlannerFunnelGenerated({
        source: payload.source ?? 'unknown',
        mode: 'ai', // cache is transparent — report as 'ai' for metrics
        channel: 'server',
      });

      return NextResponse.json(
        {
          schemaVersion: PLANNER_API_SCHEMA_VERSION,
          generatedAt: new Date().toISOString(),
          report: cachedReport,
          mode: 'ai' as const,
        },
        { status: 200, headers: { 'x-request-id': requestId, 'x-cache': 'hit' } }
      );
    }

    const generation = await generatePlannerReport({ locale, preferences: payload.preferences });

    auditFromRequest(request, {
      action: 'planner.generate',
      actor: { userId: String(session.user.id) },
      metadata: {
        locale,
        passengers,
        destinationsProvided: payload.preferences.destinos.length > 0,
        generationMode: generation.mode,
        source: payload.source,
      },
    });

    await runPostGeneration({
      userId: session.user.id,
      locale,
      preferences: payload.preferences,
      report: generation.report,
      mode: generation.mode,
      source: payload.source,
      cacheHash,
      requestId,
    });

    return NextResponse.json(
      {
        schemaVersion: PLANNER_API_SCHEMA_VERSION,
        generatedAt: new Date().toISOString(),
        report: generation.report,
        mode: generation.mode,
      },
      { status: 200, headers: { 'x-request-id': requestId } }
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

    return plannerProblemResponse({ status: 500, requestId, instance });
  }
});
