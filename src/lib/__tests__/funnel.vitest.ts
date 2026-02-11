import { describe, expect, it } from 'vitest';
import {
  LANDING_PLANNER_SOURCE,
  normalizeFunnelSource,
  withFunnelSource,
} from '@/lib/analytics/funnel';

describe('funnel analytics helpers', () => {
  it('normalizes only known source values', () => {
    expect(normalizeFunnelSource(LANDING_PLANNER_SOURCE)).toBe(LANDING_PLANNER_SOURCE);
    expect(normalizeFunnelSource('unknown')).toBeNull();
    expect(normalizeFunnelSource('')).toBeNull();
    expect(normalizeFunnelSource(undefined)).toBeNull();
  });

  it('adds source to urls and preserves existing query parameters', () => {
    expect(
      withFunnelSource('/signup?callbackUrl=%2Fdashboard%2Fplanner', LANDING_PLANNER_SOURCE)
    ).toBe('/signup?callbackUrl=%2Fdashboard%2Fplanner&source=landing_planner');
  });

  it('returns original href when source is missing or invalid', () => {
    expect(withFunnelSource('/login?callbackUrl=%2Fdashboard%2Fplanner', null)).toBe(
      '/login?callbackUrl=%2Fdashboard%2Fplanner'
    );
    expect(withFunnelSource('/login?callbackUrl=%2Fdashboard%2Fplanner', 'invalid')).toBe(
      '/login?callbackUrl=%2Fdashboard%2Fplanner'
    );
  });
});
