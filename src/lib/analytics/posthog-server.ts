import { PostHog } from 'posthog-node';

declare global {
  var __posthogClient: PostHog | null | undefined;
}

function getConfig(): { apiKey: string; host?: string } | null {
  // Prefer dedicated server vars, but fall back to NEXT_PUBLIC_* for simple setups.
  const apiKey = (process.env.POSTHOG_API_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '').trim();
  if (!apiKey) return null;

  const host = (process.env.POSTHOG_HOST ?? process.env.NEXT_PUBLIC_POSTHOG_HOST ?? '').trim();
  return { apiKey, host: host || undefined };
}

export function getPostHog(): PostHog | null {
  if (globalThis.__posthogClient !== undefined) return globalThis.__posthogClient;

  const config = getConfig();
  if (!config) {
    globalThis.__posthogClient = null;
    return null;
  }

  globalThis.__posthogClient = new PostHog(config.apiKey, {
    host: config.host,
    // Privacy: don't capture process env, stack traces, etc.
    disableGeoip: false,
  });

  return globalThis.__posthogClient;
}

export function captureServerEvent(params: {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
}): void {
  const client = getPostHog();
  if (!client) return;

  client.capture({
    distinctId: params.distinctId,
    event: params.event,
    properties: params.properties,
  });
}
