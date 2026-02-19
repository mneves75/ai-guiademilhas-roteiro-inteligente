import 'server-only';

import type { PlannerReport } from './types';
import type { TravelPreferencesInput } from './schema';
import { resolvePlannerProvider, resolvePlannerModelId } from './prompt';
import { captureServerEvent } from '@/lib/analytics/posthog-server';
import { type FunnelSource, plannerFunnelEvents } from '@/lib/analytics/funnel';
import { incPlannerFunnelGenerated } from '@/lib/metrics';

export interface PostGenerationInput {
  userId: string;
  locale: string;
  preferences: TravelPreferencesInput;
  report: PlannerReport;
  mode: 'ai' | 'fallback';
  source?: FunnelSource;
  cacheHash: string;
  requestId: string;
  /** Extra analytics properties (e.g. sectionCount, hasDestinationGuide). */
  analyticsExtra?: Record<string, unknown>;
}

export interface PostGenerationResult {
  planId?: string;
}

/**
 * Orchestrates the post-generation pipeline (all best-effort):
 * 1. Save plan to DB
 * 2. Capture analytics event
 * 3. Increment funnel metric
 * 4. Cache the report (AI mode only)
 *
 * Every step is wrapped in try/catch — failures are logged but never thrown.
 */
export async function runPostGeneration(input: PostGenerationInput): Promise<PostGenerationResult> {
  const {
    userId,
    locale,
    preferences,
    report,
    mode,
    source,
    cacheHash,
    requestId,
    analyticsExtra,
  } = input;

  let planId: string | undefined;

  // 1. Save plan to DB (only for AI mode)
  if (mode === 'ai') {
    try {
      const { createPlan } = await import('@/db/queries/plans');
      const plan = await createPlan({
        userId,
        locale,
        title: report.title,
        preferences: JSON.stringify(preferences),
        report: JSON.stringify(report),
        mode,
      });
      planId = plan.id;
    } catch (dbError) {
      console.warn('[planner.post-generation] plan save failed (best-effort)', {
        requestId,
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
    }
  }

  // 2. Capture analytics event
  if (source) {
    captureServerEvent({
      distinctId: String(userId),
      event: plannerFunnelEvents.plannerGenerated,
      properties: {
        source,
        locale,
        mode,
        channel: 'server',
        ...analyticsExtra,
      },
    });
  }

  // 3. Increment funnel metric
  incPlannerFunnelGenerated({
    source: source ?? 'unknown',
    mode: mode === 'ai' ? 'ai' : 'fallback',
    channel: 'server',
  });

  // 4. Cache the report (AI mode only)
  if (mode === 'ai') {
    try {
      const provider = resolvePlannerProvider();
      const activeModelId = resolvePlannerModelId(provider);
      const cacheModelLabel = provider === 'lmstudio' ? `lmstudio:${activeModelId}` : activeModelId;
      const { setCachedReport } = await import('@/lib/planner/cache');
      await setCachedReport(cacheHash, report, cacheModelLabel);
    } catch (cacheError) {
      console.warn('[planner.post-generation] cache save failed (best-effort)', {
        requestId,
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
    }
  }

  return { planId };
}
