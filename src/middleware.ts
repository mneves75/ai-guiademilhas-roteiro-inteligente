import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/security/rate-limit';

// Only protect actual app pages here. API routes must always enforce authz in the handler.
const PROTECTED_PAGE_PREFIXES = ['/dashboard', '/admin'] as const;

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function generateCspNonce(): string {
  // CSP nonce should be unpredictable and unique per request.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function buildProtectedCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== 'production';

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // Next.js dev tooling can require inline styles. Production should stay nonce-only.
    `style-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-inline'" : ''}`,
    "img-src 'self' blob: data: https:",
    "font-src 'self' data: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  return directives.join('; ');
}

function hasBetterAuthSessionCookie(request: NextRequest): boolean {
  const baseName = 'better-auth.session_token';
  const candidates = [baseName, `__Secure-${baseName}`, `__Host-${baseName}`];

  for (const name of candidates) {
    const value = request.cookies.get(name)?.value;
    if (value) return true;
  }

  // Defense-in-depth: treat any cookie ending with the base name as a hint, even if prefixing changes.
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.endsWith(baseName) && !!cookie.value);
}

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return 'unknown';
}

function isAllowedOrigin(origin: string, request: NextRequest): boolean {
  const allowedFromEnv =
    tryParseOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
    tryParseOrigin(process.env.BETTER_AUTH_BASE_URL) ??
    tryParseOrigin(process.env.BETTER_AUTH_URL);

  if (allowedFromEnv) return origin === allowedFromEnv;

  // Avoid deriving security decisions from request headers in production.
  if (process.env.NODE_ENV === 'production') return false;

  return origin === request.nextUrl.origin;
}

function tryParseOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getRequestOriginForCsrf(request: NextRequest): string | null {
  const origin = request.headers.get('origin');
  if (origin) return origin;

  const referer = request.headers.get('referer');
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname === '/api' || pathname.startsWith('/api/');

  // ---------------------------------------------------------------------------
  // CSRF / cross-site protections (state-changing API routes)
  // ---------------------------------------------------------------------------
  if (
    isApi &&
    STATE_CHANGING_METHODS.has(request.method) &&
    !pathname.startsWith('/api/auth') &&
    pathname !== '/api/stripe/webhook'
  ) {
    // CSRF is primarily relevant when the browser automatically attaches cookies.
    // If there is no session cookie, endpoints should return 401 anyway.
    const hasSessionCookie = hasBetterAuthSessionCookie(request);
    if (hasSessionCookie) {
      // Prefer Fetch Metadata for modern browsers.
      const fetchSite = request.headers.get('sec-fetch-site');
      if (fetchSite === 'cross-site') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const origin = getRequestOriginForCsrf(request);
      if (!origin || !isAllowedOrigin(origin, request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Best-effort rate limiting (edge-memory). For production, prefer a shared store.
  // ---------------------------------------------------------------------------
  if (pathname.startsWith('/api/auth') && request.method === 'POST') {
    const ip = getClientIp(request);
    if (ip !== 'unknown') {
      const result = await checkRateLimit({
        namespace: 'auth',
        identifier: ip,
        max: 30,
        windowMs: 10 * 60 * 1000, // 30 requests / 10 minutes / IP
      });
      if (!result.ok) {
        return NextResponse.json(
          { error: 'Too Many Requests' },
          {
            status: 429,
            headers: { 'Retry-After': String(result.retryAfterSeconds) },
          }
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Protected pages
  // ---------------------------------------------------------------------------
  // This is intentionally a lightweight check for "no session cookie at all".
  // Actual session validity and authorization must be enforced in RSC/layouts + API routes.
  const isProtectedPage =
    !isApi && PROTECTED_PAGE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtectedPage) {
    const hasSessionCookie = hasBetterAuthSessionCookie(request);
    if (!hasSessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set(
        'callbackUrl',
        `${request.nextUrl.pathname}${request.nextUrl.search}`
      );
      return NextResponse.redirect(loginUrl);
    }

    // Protected pages handle sensitive data. Apply a strict nonce-based CSP.
    const nonce = generateCspNonce();
    const cspHeader = buildProtectedCsp(nonce);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', cspHeader);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set('Content-Security-Policy', cspHeader);
    // Avoid caching personalized HTML at intermediaries.
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
