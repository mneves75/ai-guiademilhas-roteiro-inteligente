'use client';

import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react';
import posthog from 'posthog-js';
import { useEffect, useMemo } from 'react';

function getConfig(): { apiHost: string; clientKey: string } | null {
  const apiHost = process.env.NEXT_PUBLIC_GROWTHBOOK_API_HOST?.trim() ?? '';
  const clientKey = process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY?.trim() ?? '';
  if (!apiHost || !clientKey) return null;
  return { apiHost, clientKey };
}

export function ExperimentsProvider({ children }: { children: React.ReactNode }) {
  const config = getConfig();

  const growthbook = useMemo(() => {
    if (!config) return null;

    return new GrowthBook({
      apiHost: config.apiHost,
      clientKey: config.clientKey,
      enableDevMode: process.env.NODE_ENV !== 'production',
      trackingCallback: (experiment, result) => {
        // Best-effort; if PostHog isn't configured, this is a no-op.
        posthog.capture('experiment_viewed', {
          experiment_key: experiment.key,
          variation_id: result.variationId,
        });
      },
    });
  }, [config]);

  useEffect(() => {
    if (!growthbook) return;

    growthbook.setAttributes({
      // GrowthBook expects stable user identifiers for consistent bucketing.
      id: posthog.get_distinct_id?.(),
    });

    void growthbook.loadFeatures({ autoRefresh: true });

    return () => {
      growthbook.destroy();
    };
  }, [growthbook]);

  if (!growthbook) return <>{children}</>;

  return <GrowthBookProvider growthbook={growthbook}>{children}</GrowthBookProvider>;
}
