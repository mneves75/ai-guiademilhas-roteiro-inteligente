import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

declare global {
  var __metricsRegistry: Registry | undefined;
  var __metricsInitialized: boolean | undefined;
  var __appMetrics:
    | {
        blockedRequestsTotal: Counter<'reason'>;
        authRateLimitedTotal: Counter;
        protectedRedirectsTotal: Counter;
        proxyLatencyMs: Histogram<'outcome'>;
        plannerFunnelGeneratedTotal: Counter<'source' | 'mode' | 'channel'>;
      }
    | undefined;
}

export function getMetricsRegistry(): Registry {
  if (!globalThis.__metricsRegistry) {
    globalThis.__metricsRegistry = new Registry();
  }

  if (!globalThis.__metricsInitialized) {
    collectDefaultMetrics({ register: globalThis.__metricsRegistry });
    globalThis.__metricsInitialized = true;
  }

  return globalThis.__metricsRegistry;
}

function getAppMetrics() {
  if (globalThis.__appMetrics) return globalThis.__appMetrics;

  const register = getMetricsRegistry();

  // Counters are intentionally coarse-grained (low cardinality) to be safe by default.
  const blockedRequestsTotal = new Counter({
    name: 'app_blocked_requests_total',
    help: 'Requests blocked at the proxy layer (e.g., CSRF hardening).',
    labelNames: ['reason'] as const,
    registers: [register],
  });

  const authRateLimitedTotal = new Counter({
    name: 'app_auth_rate_limited_total',
    help: 'Number of auth POST requests blocked by rate limiting at proxy.',
    registers: [register],
  });

  const protectedRedirectsTotal = new Counter({
    name: 'app_protected_redirects_total',
    help: 'Number of redirects to /login from protected pages due to missing session cookie.',
    registers: [register],
  });

  const proxyLatencyMs = new Histogram({
    name: 'app_proxy_latency_ms',
    help: 'Proxy decision latency in milliseconds (only for early-return outcomes and protected pages).',
    labelNames: ['outcome'] as const,
    buckets: [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000],
    registers: [register],
  });

  const plannerFunnelGeneratedTotal = new Counter({
    name: 'app_planner_funnel_generated_total',
    help: 'Planner reports generated, labeled by funnel source, generation mode, and telemetry channel.',
    labelNames: ['source', 'mode', 'channel'] as const,
    registers: [register],
  });

  globalThis.__appMetrics = {
    blockedRequestsTotal,
    authRateLimitedTotal,
    protectedRedirectsTotal,
    proxyLatencyMs,
    plannerFunnelGeneratedTotal,
  };

  return globalThis.__appMetrics;
}

export function incBlockedRequest(reason: 'csrf_cross_site' | 'csrf_origin' | 'unknown') {
  getAppMetrics().blockedRequestsTotal.inc({ reason }, 1);
}

export function incAuthRateLimited() {
  getAppMetrics().authRateLimitedTotal.inc(1);
}

export function incProtectedRedirect() {
  getAppMetrics().protectedRedirectsTotal.inc(1);
}

export function observeProxyLatencyMs(
  outcome: 'blocked' | 'rate_limited' | 'redirect' | 'protected' | 'public_rewrite',
  ms: number
) {
  getAppMetrics().proxyLatencyMs.observe({ outcome }, ms);
}

export function incPlannerFunnelGenerated(labels: {
  source: 'landing_planner' | 'unknown';
  mode: 'ai' | 'fallback';
  channel: 'server' | 'client';
}) {
  getAppMetrics().plannerFunnelGeneratedTotal.inc(labels, 1);
}

export async function renderMetricsText(): Promise<string> {
  return getMetricsRegistry().metrics();
}

export function getMetricsContentType(): string {
  return getMetricsRegistry().contentType;
}
