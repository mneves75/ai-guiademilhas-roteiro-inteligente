'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { usePathname } from 'next/navigation';

function stripQuery(url: string): string {
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : undefined);
    // Keep only the path. Query strings often contain tokens/callbackUrl/etc.
    return parsed.pathname;
  } catch {
    const idx = url.indexOf('?');
    return idx === -1 ? url : url.slice(0, idx);
  }
}

function getConfig() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '';
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? '';
  return { key: key.trim(), host: host.trim() };
}

export function PostHogAnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { key, host } = getConfig();
  const pathname = usePathname();

  useEffect(() => {
    if (!key) return;
    posthog.init(key, {
      api_host: host || 'https://app.posthog.com',
      // We'll capture pageviews manually so SPA navigations are tracked correctly.
      capture_pageview: false,
      capture_pageleave: true,
      // Disable autocapture by default; enable explicitly if you need it.
      autocapture: false,
      // Privacy: never send query strings (tokens, callbackUrl, etc.) to analytics.
      before_send: (event) => {
        if (!event) return event;
        const properties = event.properties;
        if (properties && typeof properties === 'object') {
          const p = properties as Record<string, unknown>;
          for (const k of ['$current_url', '$referrer', '$initial_referrer']) {
            const v = p[k];
            if (typeof v === 'string') p[k] = stripQuery(v);
          }
        }
        return event;
      },
    });
  }, [key, host]);

  useEffect(() => {
    if (!key) return;
    // Explicitly omit query strings to avoid leaking tokens into analytics.
    posthog.capture('$pageview', { $current_url: pathname });
  }, [key, pathname]);

  if (!key) return <>{children}</>;

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
