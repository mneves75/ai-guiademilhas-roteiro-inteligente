import type { NextRequest } from 'next/server';

function tryGetOriginFromEnv(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function resolveOriginFromForwardedHeaders(request: NextRequest): string | null {
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host')?.trim();
  if (!host) return null;

  const proto = forwardedProto || request.nextUrl.protocol.replace(':', '') || 'http';
  return `${proto}://${host}`;
}

/**
 * Resolve the canonical app origin for server-side redirects/return URLs.
 *
 * Prefer explicit env configuration over request headers.
 */
export function resolveAppOrigin(request: NextRequest): string {
  const fromEnv =
    tryGetOriginFromEnv(process.env.NEXT_PUBLIC_APP_URL) ??
    tryGetOriginFromEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (fromEnv) return fromEnv;

  // In production, do not derive the canonical origin from request headers.
  // It's too easy to misconfigure proxies and end up with host header issues.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing NEXT_PUBLIC_APP_URL (or NEXT_PUBLIC_SUPABASE_URL). ' +
        'Refusing to build return URLs from request-derived origins in production.'
    );
  }

  // In non-production, allow dev proxies/tunnels to set the canonical origin via forwarded headers.
  return resolveOriginFromForwardedHeaders(request) ?? request.nextUrl.origin;
}
