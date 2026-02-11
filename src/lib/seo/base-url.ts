function tryGetOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * Canonical public origin used for SEO URLs (sitemap/robots/rss/JSON-LD).
 *
 * Keep this tolerant for the boilerplate: fallback to shipped.dev when not configured.
 * For real production apps, you should set NEXT_PUBLIC_APP_URL explicitly.
 */
export function resolvePublicOrigin(): string {
  return (
    tryGetOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
    tryGetOrigin(process.env.BETTER_AUTH_BASE_URL) ??
    tryGetOrigin(process.env.BETTER_AUTH_URL) ??
    'https://shipped.dev'
  );
}
