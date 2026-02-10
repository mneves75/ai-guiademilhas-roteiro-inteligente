import type { Locale } from './locale';
import { m } from './messages';
import { ONE_TIME_PRODUCT, PLAN_CATALOG, type PlanId } from './plan-catalog';

export function getLocalizedPlan(locale: Locale, planId: PlanId) {
  const base = PLAN_CATALOG[planId];
  const copy = m(locale).plans[planId];
  return {
    ...base,
    ...copy,
    // Ensure the features come from copy (localized).
    features: [...copy.features],
  };
}

export function getLocalizedPlans(locale: Locale) {
  return (Object.keys(PLAN_CATALOG) as PlanId[]).map((id) => getLocalizedPlan(locale, id));
}

export function getLocalizedOneTimeProduct(locale: Locale) {
  const copy = m(locale).oneTimeProduct;
  return {
    ...ONE_TIME_PRODUCT,
    ...copy,
  };
}
