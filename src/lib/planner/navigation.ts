import { buildLoginRedirectHref } from '@/lib/security/redirect';
import { withFunnelSource, type FunnelSource } from '@/lib/analytics/funnel';

export const PLANNER_PATH = '/planner';

function encode(path: string): string {
  return encodeURIComponent(path);
}

export function plannerLoginHref(source?: FunnelSource | null): string {
  return withFunnelSource(
    buildLoginRedirectHref(PLANNER_PATH, { defaultPath: PLANNER_PATH }),
    source
  );
}

export function plannerSignupHref(source?: FunnelSource | null): string {
  return withFunnelSource(`/signup?callbackUrl=${encode(PLANNER_PATH)}`, source);
}
