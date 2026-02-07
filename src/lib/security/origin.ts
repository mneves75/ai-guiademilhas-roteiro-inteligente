import type { NextRequest } from 'next/server';

function tryGetOriginFromEnv(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * Resolve the canonical app origin for server-side redirects/return URLs.
 *
 * Prefer explicit env configuration over request headers.
 */
export function resolveAppOrigin(request: NextRequest): string {
  const fromEnv =
    tryGetOriginFromEnv(process.env.NEXT_PUBLIC_APP_URL) ??
    tryGetOriginFromEnv(process.env.BETTER_AUTH_BASE_URL) ??
    tryGetOriginFromEnv(process.env.BETTER_AUTH_URL);

  if (fromEnv) return fromEnv;

  // In production, do not derive the canonical origin from request headers.
  // It's too easy to misconfigure proxies and end up with host header issues.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing NEXT_PUBLIC_APP_URL (or BETTER_AUTH_BASE_URL/BETTER_AUTH_URL). ' +
        'Refusing to build return URLs from request-derived origins in production.'
    );
  }

  return request.nextUrl.origin;
}
