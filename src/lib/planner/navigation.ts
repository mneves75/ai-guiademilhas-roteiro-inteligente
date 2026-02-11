import { buildLoginRedirectHref } from '@/lib/security/redirect';

export const PLANNER_PATH = '/dashboard/planner';

function encode(path: string): string {
  return encodeURIComponent(path);
}

export function plannerLoginHref(): string {
  return buildLoginRedirectHref(PLANNER_PATH, { defaultPath: PLANNER_PATH });
}

export function plannerSignupHref(): string {
  return `/signup?callbackUrl=${encode(PLANNER_PATH)}`;
}
