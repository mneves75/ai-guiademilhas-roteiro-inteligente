export const PLANNER_PATH = '/dashboard/planner';

function encode(path: string): string {
  return encodeURIComponent(path);
}

export function plannerLoginHref(): string {
  return `/login?callbackUrl=${encode(PLANNER_PATH)}`;
}

export function plannerSignupHref(): string {
  return `/signup?callbackUrl=${encode(PLANNER_PATH)}`;
}
