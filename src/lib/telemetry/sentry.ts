import * as Sentry from '@sentry/node';

let initialized = false;
let enabled = false;

function initSentry(): void {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  const tracesSampleRateRaw = process.env.SENTRY_TRACES_SAMPLE_RATE;
  const tracesSampleRate = tracesSampleRateRaw ? Number.parseFloat(tracesSampleRateRaw) : 0;

  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT ??
      process.env.VERCEL_ENV ??
      process.env.NODE_ENV ??
      'development',
    release: process.env.SENTRY_RELEASE?.trim() || undefined,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0,
  });

  enabled = true;
}

export function captureException(err: unknown, context: Record<string, unknown> = {}): void {
  initSentry();
  if (!enabled) return;

  Sentry.withScope((scope) => {
    scope.setExtras(context);
    Sentry.captureException(err);
  });
}

export async function flushSentry(timeoutMs = 2000): Promise<void> {
  initSentry();
  if (!enabled) return;
  await Sentry.flush(timeoutMs);
}
