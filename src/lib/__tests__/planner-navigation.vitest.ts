import { describe, expect, it } from 'vitest';
import { plannerLoginHref, plannerSignupHref, PLANNER_PATH } from '@/lib/planner/navigation';

describe('planner navigation', () => {
  it('uses planner path as callback target', () => {
    expect(PLANNER_PATH).toBe('/dashboard/planner');
  });

  it('builds login href with encoded callback', () => {
    expect(plannerLoginHref()).toBe('/login?callbackUrl=%2Fdashboard%2Fplanner');
  });

  it('builds signup href with encoded callback', () => {
    expect(plannerSignupHref()).toBe('/signup?callbackUrl=%2Fdashboard%2Fplanner');
  });
});
