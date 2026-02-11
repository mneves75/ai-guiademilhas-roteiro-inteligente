export type FunnelSnapshot = {
  landingViews: number;
  authCompleted: number;
  plannerGenerated: number;
};

export type FunnelSloConfig = {
  minLandingToAuthRate: number;
  minAuthToPlannerRate: number;
};

export const DEFAULT_FUNNEL_SLO: FunnelSloConfig = {
  // Conservative defaults for early-stage acquisition funnel.
  minLandingToAuthRate: 0.2,
  minAuthToPlannerRate: 0.6,
};

export type FunnelSloEvaluation = {
  landingToAuthRate: number;
  authToPlannerRate: number;
  passed: boolean;
  breaches: string[];
};

function safeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

export function evaluateFunnelSlo(
  snapshot: FunnelSnapshot,
  config: FunnelSloConfig = DEFAULT_FUNNEL_SLO
): FunnelSloEvaluation {
  const landingToAuthRate = safeRate(snapshot.authCompleted, snapshot.landingViews);
  const authToPlannerRate = safeRate(snapshot.plannerGenerated, snapshot.authCompleted);

  const breaches: string[] = [];
  if (landingToAuthRate < config.minLandingToAuthRate) {
    breaches.push('landing_to_auth_below_slo');
  }
  if (authToPlannerRate < config.minAuthToPlannerRate) {
    breaches.push('auth_to_planner_below_slo');
  }

  return {
    landingToAuthRate,
    authToPlannerRate,
    passed: breaches.length === 0,
    breaches,
  };
}
