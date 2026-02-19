import { type NextRequest } from 'next/server';
import { auditFromRequest } from '@/audit';
import { getSession } from '@/lib/auth';
import { isHttpError } from '@/lib/http';
import { readJsonBodyAs } from '@/lib/http-body';
import { withApiLogging } from '@/lib/logging';
import { normalizeLocale } from '@/lib/locale';
import { getOrCreateRequestId } from '@/lib/request-id';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { streamPlannerReport } from '@/lib/planner/stream-report';
import { resolvePlannerApiKey, resolvePlannerProvider } from '@/lib/planner/prompt';
import { buildFallbackReport, generatePlannerReport } from '@/lib/planner/generate-report';
import { plannerGenerateRequestSchema } from '@/lib/planner/schema';
import { plannerReportSchema } from '@/lib/planner/schema';
import { captureServerEvent } from '@/lib/analytics/posthog-server';
import { plannerFunnelEvents } from '@/lib/analytics/funnel';
import { incPlannerFunnelGenerated } from '@/lib/metrics';
import { plannerProblemResponse } from '@/lib/planner/problem-response';
import type { PlannerStreamEvent, ReportSection } from '@/lib/planner/types';
import { sseHeaders, encodeEvent, singleEventResponse } from '@/lib/planner/sse';
import { runPostGeneration } from '@/lib/planner/post-generation';

const RATE_LIMIT_MAX = 6;
const RATE_LIMIT_WINDOW_MS = 60_000;

export const runtime = 'nodejs';

export const POST = withApiLogging('api.planner.generate-stream', async (request: NextRequest) => {
  const requestId = getOrCreateRequestId(request);
  const instance = request.nextUrl.pathname;

  try {
    // --- Auth check ---
    const session = await getSession();
    if (!session) {
      return plannerProblemResponse({ status: 401, requestId, instance });
    }

    // --- Rate limit ---
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

    // --- Request body validation ---
    const payload = await readJsonBodyAs(request, plannerGenerateRequestSchema);
    const locale = normalizeLocale(payload.locale);
    const { preferences } = payload;

    // --- Audit log ---
    auditFromRequest(request, {
      action: 'planner.generate-stream',
      actor: { userId: String(session.user.id) },
      metadata: {
        locale,
        passengers: preferences.num_adultos + preferences.num_chd + preferences.num_inf,
        destinationsProvided: preferences.destinos.length > 0,
        source: payload.source,
      },
    });

    // --- Check cache ---
    const { hashPreferences, getCachedReport } = await import('@/lib/planner/cache');
    const cacheHash = await hashPreferences(preferences);
    const cachedReport = await getCachedReport(cacheHash);

    if (cachedReport) {
      let planId: string | undefined;
      try {
        const { createPlan } = await import('@/db/queries/plans');
        const plan = await createPlan({
          userId: session.user.id,
          locale,
          title: cachedReport.title,
          preferences: JSON.stringify(preferences),
          report: JSON.stringify(cachedReport),
          mode: 'cached',
        });
        planId = plan.id;
      } catch (e) {
        console.warn('[planner.generate-stream] cached plan save failed', {
          requestId,
          error: e instanceof Error ? e.message : String(e),
        });
      }
      if (payload.source) {
        captureServerEvent({
          distinctId: String(session.user.id),
          event: plannerFunnelEvents.plannerGenerated,
          properties: { source: payload.source, locale, mode: 'cached', channel: 'server' },
        });
      }
      incPlannerFunnelGenerated({
        source: payload.source ?? 'unknown',
        mode: 'ai',
        channel: 'server',
      });
      return singleEventResponse(
        { type: 'complete', report: cachedReport, mode: 'ai', planId },
        requestId,
        { 'x-cache': 'hit' }
      );
    }

    // --- Check API key before starting stream ---
    const provider = resolvePlannerProvider();
    const apiKey = resolvePlannerApiKey(provider);
    if (provider === 'google' && !apiKey) {
      const fallbackReport = buildFallbackReport({
        locale,
        preferences,
        reason: 'missing_api_key',
      });
      return singleEventResponse(
        { type: 'complete', report: fallbackReport, mode: 'fallback' },
        requestId
      );
    }

    if (provider === 'lmstudio') {
      const generation = await generatePlannerReport({ locale, preferences });
      const { planId } =
        generation.mode === 'ai'
          ? await runPostGeneration({
              userId: session.user.id,
              locale,
              preferences,
              report: generation.report,
              mode: 'ai',
              source: payload.source,
              cacheHash,
              requestId,
              analyticsExtra: { provider: 'lmstudio' },
            })
          : { planId: undefined };
      if (generation.mode === 'fallback') {
        if (payload.source) {
          captureServerEvent({
            distinctId: String(session.user.id),
            event: plannerFunnelEvents.plannerGenerated,
            properties: {
              source: payload.source,
              locale,
              mode: 'fallback',
              channel: 'server',
              provider: 'lmstudio',
            },
          });
        }
        incPlannerFunnelGenerated({
          source: payload.source ?? 'unknown',
          mode: 'fallback',
          channel: 'server',
        });
      }
      return singleEventResponse(
        { type: 'complete', report: generation.report, mode: generation.mode, planId },
        requestId
      );
    }

    // --- Google streaming path ---
    const streamResult = streamPlannerReport({ locale, preferences, signal: request.signal });

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: PlannerStreamEvent) => controller.enqueue(encodeEvent(event));

        try {
          let lastSectionCount = 0;
          let lastTitle: string | undefined;
          let lastSummary: string | undefined;

          for await (const partial of streamResult.partialOutputStream) {
            const currentSections = partial.sections ?? [];
            const completeSections = currentSections.filter(
              (s): s is ReportSection =>
                !!s && typeof s.title === 'string' && Array.isArray(s.items) && s.items.length > 0
            );
            const titleChanged = partial.title !== lastTitle;
            const summaryChanged = partial.summary !== lastSummary;
            const sectionsGrew = completeSections.length > lastSectionCount;

            if (titleChanged || summaryChanged || sectionsGrew) {
              send({
                type: 'delta',
                title: typeof partial.title === 'string' ? partial.title : undefined,
                summary: typeof partial.summary === 'string' ? partial.summary : undefined,
                sections: completeSections,
              });
              lastTitle = partial.title as string | undefined;
              lastSummary = partial.summary as string | undefined;
              lastSectionCount = completeSections.length;
            }
          }

          const finalObject = await streamResult.output;
          const parsed = plannerReportSchema.safeParse(finalObject);

          if (parsed.success) {
            const { planId } = await runPostGeneration({
              userId: session.user.id,
              locale,
              preferences,
              report: parsed.data,
              mode: 'ai',
              source: payload.source,
              cacheHash,
              requestId,
              analyticsExtra: {
                sectionCount: parsed.data.sections.length,
                hasDestinationGuide: parsed.data.sections.some(
                  (s) =>
                    s.title.toLowerCase().includes('guia') ||
                    s.title.toLowerCase().includes('guide')
                ),
                destinationsRequested: preferences.destinos.trim().length > 0,
                assumptionCount: parsed.data.assumptions.length,
                hasStructuredItems: parsed.data.sections.some((s) =>
                  s.items.some((item) => typeof item !== 'string')
                ),
              },
            });
            send({ type: 'complete', report: parsed.data, mode: 'ai', planId });
          } else {
            const fallbackReport = buildFallbackReport({
              locale,
              preferences,
              reason: 'provider_failure',
            });
            if (payload.source) {
              captureServerEvent({
                distinctId: String(session.user.id),
                event: plannerFunnelEvents.plannerGenerated,
                properties: { source: payload.source, locale, mode: 'fallback', channel: 'server' },
              });
            }
            incPlannerFunnelGenerated({
              source: payload.source ?? 'unknown',
              mode: 'fallback',
              channel: 'server',
            });
            send({ type: 'complete', report: fallbackReport, mode: 'fallback' });
          }
        } catch (streamError) {
          console.warn('[planner.generate-stream] stream failed', {
            requestId,
            error: streamError instanceof Error ? streamError.message : String(streamError),
          });
          send({
            type: 'error',
            code: 'stream_failed',
            message:
              locale === 'pt-BR' ? 'Falha na geração do relatório.' : 'Failed to generate report.',
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: sseHeaders(requestId) });
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
