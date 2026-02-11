export const LANDING_PLANNER_SOURCE = 'landing_planner' as const;

export type FunnelSource = typeof LANDING_PLANNER_SOURCE;

export const PLANNER_FUNNEL_STORAGE_KEY = 'planner_funnel_source';

const KNOWN_SOURCES = new Set<string>([LANDING_PLANNER_SOURCE]);

export function normalizeFunnelSource(value: string | null | undefined): FunnelSource | null {
  if (!value) return null;
  return KNOWN_SOURCES.has(value) ? (value as FunnelSource) : null;
}

export function withFunnelSource(
  href: string,
  source: FunnelSource | string | null | undefined
): string {
  const normalized = normalizeFunnelSource(source);
  if (!normalized) return href;

  const [beforeHash = '', hash = ''] = href.split('#', 2);
  const [pathname, query = ''] = beforeHash.split('?', 2);
  const params = new URLSearchParams(query);
  params.set('source', normalized);
  const queryString = params.toString();

  return `${pathname}${queryString ? `?${queryString}` : ''}${hash ? `#${hash}` : ''}`;
}

export const plannerFunnelEvents = {
  authViewed: 'planner_funnel_auth_viewed',
  authCompleted: 'planner_funnel_auth_completed',
  plannerOpened: 'planner_funnel_opened',
  plannerGenerated: 'planner_funnel_generated',
} as const;
