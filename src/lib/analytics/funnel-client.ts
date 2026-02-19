'use client';

import posthog from 'posthog-js';
import {
  normalizeFunnelSource,
  PLANNER_FUNNEL_STORAGE_KEY,
  plannerFunnelEvents,
  type FunnelSource,
} from '@/lib/analytics/funnel';

type PlannerFunnelEvent = (typeof plannerFunnelEvents)[keyof typeof plannerFunnelEvents];

export function rememberPlannerFunnelSource(source: FunnelSource | null): void {
  if (!source || typeof window === 'undefined') return;
  window.sessionStorage.setItem(PLANNER_FUNNEL_STORAGE_KEY, source);
}

export function readPlannerFunnelSource(): FunnelSource | null {
  if (typeof window === 'undefined') return null;
  return normalizeFunnelSource(window.sessionStorage.getItem(PLANNER_FUNNEL_STORAGE_KEY));
}

export function clearPlannerFunnelSource(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(PLANNER_FUNNEL_STORAGE_KEY);
}

export function capturePlannerFunnelEvent(
  event: PlannerFunnelEvent,
  properties: Record<string, unknown>
): void {
  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never block UX.
  }
}
