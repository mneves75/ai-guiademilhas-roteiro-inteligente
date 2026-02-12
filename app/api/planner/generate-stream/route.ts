import { type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { auditFromRequest } from '@/audit';
import { getAuth } from '@/lib/auth';
import { isHttpError } from '@/lib/http';
import { readJsonBodyAs } from '@/lib/http-body';
import { withApiLogging } from '@/lib/logging';
import { normalizeLocale } from '@/lib/locale';
import { getOrCreateRequestId } from '@/lib/request-id';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { streamPlannerReport } from '@/lib/planner/stream-report';
import { resolvePlannerApiKey } from '@/lib/planner/prompt';
import { buildFallbackReport } from '@/lib/planner/generate-report';
import { plannerGenerateRequestSchema } from '@/lib/planner/schema';
import { plannerReportSchema } from '@/lib/planner/schema';
import { captureServerEvent } from '@/lib/analytics/posthog-server';
import { plannerFunnelEvents } from '@/lib/analytics/funnel';
import { incPlannerFunnelGenerated } from '@/lib/metrics';
import { plannerProblemResponse } from '@/lib/planner/problem-response';
import type { PlannerStreamEvent, ReportSection } from '@/lib/planner/types';

const RATE_LIMIT_MAX = 6;
const RATE_LIMIT_WINDOW_MS = 60_000;

export const runtime = 'nodejs';

export const POST = withApiLogging('api.planner.generate-stream', async (request: NextRequest) => {
  const requestId = getOrCreateRequestId(request);
  const instance = request.nextUrl.pathname;

  try {
    // --- Auth check ---
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return plannerProblemResponse({
        status: 401,
        requestId,
        instance,
      });
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
      actor: {
        userId: String(session.user.id),
      },
      metadata: {
        locale,
        passengers: preferences.num_adultos + preferences.num_chd + preferences.num_inf,
        destinationsProvided: preferences.destinos.length > 0,
        source: payload.source,
      },
    });

    // --- Check API key antes de iniciar stream ---
    const apiKey = resolvePlannerApiKey();
    if (!apiKey) {
      // Retornar fallback como evento SSE unico
      const fallbackReport = buildFallbackReport({
        locale,
        preferences,
        reason: 'missing_api_key',
      });
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const event: PlannerStreamEvent = {
            type: 'complete',
            report: fallbackReport,
            mode: 'fallback',
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-store',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
          'x-request-id': requestId,
        },
      });
    }

    // --- Iniciar streaming ---
    const streamResult = streamPlannerReport({ locale, preferences, signal: request.signal });
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: PlannerStreamEvent) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        try {
          let lastSectionCount = 0;
          let lastTitle: string | undefined;
          let lastSummary: string | undefined;

          // Iterar sobre os deltas parciais do partialOutputStream
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

          // Obter objeto final completo via output promise
          const finalObject = await streamResult.output;
          const parsed = plannerReportSchema.safeParse(finalObject);

          if (parsed.success) {
            // Auto-save plan to DB (best-effort)
            let planId: string | undefined;
            try {
              const { createPlan } = await import('@/db/queries/plans');
              const plan = await createPlan({
                userId: session.user.id,
                locale,
                title: parsed.data.title,
                preferences: JSON.stringify(preferences),
                report: JSON.stringify(parsed.data),
                mode: 'ai',
              });
              planId = plan.id;
            } catch (dbError) {
              console.warn('[planner.generate-stream] plan save failed (best-effort)', {
                requestId,
                error: dbError instanceof Error ? dbError.message : String(dbError),
              });
            }

            // Analytics
            if (payload.source) {
              captureServerEvent({
                distinctId: String(session.user.id),
                event: plannerFunnelEvents.plannerGenerated,
                properties: {
                  source: payload.source,
                  locale,
                  mode: 'ai',
                  channel: 'server',
                },
              });
            }

            incPlannerFunnelGenerated({
              source: payload.source ?? 'unknown',
              mode: 'ai',
              channel: 'server',
            });

            send({ type: 'complete', report: parsed.data, mode: 'ai', planId });
          } else {
            // Validacao falhou - enviar fallback
            const fallbackReport = buildFallbackReport({
              locale,
              preferences,
              reason: 'provider_failure',
            });

            if (payload.source) {
              captureServerEvent({
                distinctId: String(session.user.id),
                event: plannerFunnelEvents.plannerGenerated,
                properties: {
                  source: payload.source,
                  locale,
                  mode: 'fallback',
                  channel: 'server',
                },
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
              locale === 'pt-BR' ? 'Falha na geracao do relatorio.' : 'Failed to generate report.',
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        'x-request-id': requestId,
      },
    });
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
