import { describe, expect, it } from 'vitest';
import { DEFAULT_FUNNEL_SLO, evaluateFunnelSlo } from '@/lib/analytics/funnel-slo';

describe('funnel SLO evaluation', () => {
  it('passes when both funnel steps meet threshold', () => {
    const result = evaluateFunnelSlo(
      {
        landingViews: 1000,
        authCompleted: 260,
        plannerGenerated: 180,
      },
      DEFAULT_FUNNEL_SLO
    );

    expect(result.passed).toBe(true);
    expect(result.breaches).toHaveLength(0);
  });

  it('fails when landing to auth rate is below threshold', () => {
    const result = evaluateFunnelSlo(
      {
        landingViews: 1000,
        authCompleted: 100,
        plannerGenerated: 80,
      },
      DEFAULT_FUNNEL_SLO
    );

    expect(result.passed).toBe(false);
    expect(result.breaches).toContain('landing_to_auth_below_slo');
  });

  it('fails when auth to planner rate is below threshold', () => {
    const result = evaluateFunnelSlo(
      {
        landingViews: 1000,
        authCompleted: 300,
        plannerGenerated: 120,
      },
      DEFAULT_FUNNEL_SLO
    );

    expect(result.passed).toBe(false);
    expect(result.breaches).toContain('auth_to_planner_below_slo');
  });
});
