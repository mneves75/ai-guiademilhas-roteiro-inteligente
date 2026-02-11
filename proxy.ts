import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { getOrCreateRequestId } from '@/lib/request-id';
import { normalizeLocale, type Locale, LOCALE_COOKIE } from '@/lib/locale';
import { publicPathname, stripPublicLocalePrefix } from '@/lib/locale-routing';
import {
  incAuthRateLimited,
  incBlockedRequest,
  incProtectedRedirect,
  observeProxyLatencyMs,
} from '@/lib/metrics';

// Only protect actual app pages here. API routes must always enforce authz in the handler.
const PROTECTED_PAGE_PREFIXES = ['/dashboard', '/admin'] as const;

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const PUBLIC_LOCALIZED_PREFIXES = [
  '/',
  '/pricing',
  '/blog',
  '/privacy',
  '/terms',
  '/security',
] as const;

function withRequestId(response: NextResponse, requestId: string): NextResponse {
  response.headers.set('x-request-id', requestId);
  return response;
}

function getPreferredLocale(request: NextRequest): Locale {
  const fromCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (fromCookie) return normalizeLocale(fromCookie);

  // SEO + determinism: do not redirect based on inferred language. Default to English unless
  // the user explicitly chose a locale (cookie) or visited a locale-prefixed URL.
  return 'en';
}

function isPublicLocalizedPath(pathname: string): boolean {
  if (pathname === '/') return true;
  if (pathname.startsWith('/blog/')) return true;
  return (PUBLIC_LOCALIZED_PREFIXES as readonly string[]).some((p) => pathname === p);
}

function isNeverLocalizedPath(pathname: string): boolean {
  return (
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/rss.xml' ||
    pathname === '/health' ||
    pathname.startsWith('/health/') ||
    pathname === '/metrics' ||
    pathname.startsWith('/metrics/') ||
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/emails/') ||
    pathname.startsWith('/invite/') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/.well-known/')
  );
}

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

export async function proxy(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getOrCreateRequestId(request);
  const { pathname, search } = request.nextUrl;
  const isApi = pathname === '/api' || pathname.startsWith('/api/');

  // ---------------------------------------------------------------------------
  // Locale-stable public URLs (SEO): `/en/...` and `/pt-br/...`
  // - Keep auth/protected/api/infra paths unprefixed.
  // - Rewrite locale-prefixed public pages to the underlying App Router routes.
  // - Redirect legacy unprefixed public pages to the locale-prefixed canonical URL.
  // ---------------------------------------------------------------------------
  const prefixed = stripPublicLocalePrefix(pathname);
  if (prefixed) {
    if (isNeverLocalizedPath(prefixed.restPathname)) {
      // Strip locale prefixes on non-public surfaces (defense-in-depth).
      const dest = new URL(`${prefixed.restPathname}${search}`, request.url);
      const res = NextResponse.redirect(dest, 308);
      if (
        prefixed.restPathname.startsWith('/dashboard') ||
        prefixed.restPathname.startsWith('/admin') ||
        prefixed.restPathname.startsWith('/invite') ||
        prefixed.restPathname === '/emails/preview'
      ) {
        res.headers.set('X-Robots-Tag', 'noindex, nofollow');
      }
      res.headers.set('Cache-Control', 'no-store, max-age=0');
      return withRequestId(res, requestId);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-request-id', requestId);
    requestHeaders.set('x-shipped-locale', prefixed.locale);
    requestHeaders.set('x-shipped-public-pathname', pathname);

    const dest = request.nextUrl.clone();
    dest.pathname = prefixed.restPathname;
    const res = NextResponse.rewrite(dest, { request: { headers: requestHeaders } });
    res.headers.set('x-request-id', requestId);
    observeProxyLatencyMs('public_rewrite', Date.now() - startedAt);
    return res;
  }

  if (!isNeverLocalizedPath(pathname) && isPublicLocalizedPath(pathname)) {
    const locale = getPreferredLocale(request);
    const destPath = publicPathname(locale, pathname);
    const dest = new URL(`${destPath}${search}`, request.url);
    const res = NextResponse.redirect(dest, 308);
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return withRequestId(res, requestId);
  }

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
        incBlockedRequest('csrf_cross_site');
        observeProxyLatencyMs('blocked', Date.now() - startedAt);
        return withRequestId(NextResponse.json({ error: 'Forbidden' }, { status: 403 }), requestId);
      }

      const origin = getRequestOriginForCsrf(request);
      if (!origin || !isAllowedOrigin(origin, request)) {
        incBlockedRequest('csrf_origin');
        observeProxyLatencyMs('blocked', Date.now() - startedAt);
        return withRequestId(NextResponse.json({ error: 'Forbidden' }, { status: 403 }), requestId);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Best-effort rate limiting (process memory). For production, prefer a shared store.
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
        incAuthRateLimited();
        observeProxyLatencyMs('rate_limited', Date.now() - startedAt);
        return withRequestId(
          NextResponse.json(
            { error: 'Too Many Requests' },
            {
              status: 429,
              headers: { 'Retry-After': String(result.retryAfterSeconds) },
            }
          ),
          requestId
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
    const protectedCallbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    const hasSessionCookie = hasBetterAuthSessionCookie(request);
    if (!hasSessionCookie) {
      incProtectedRedirect();
      observeProxyLatencyMs('redirect', Date.now() - startedAt);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', protectedCallbackUrl);
      const res = NextResponse.redirect(loginUrl);
      // Avoid caching redirects from sensitive pages at intermediaries.
      res.headers.set('Cache-Control', 'no-store, max-age=0');
      return withRequestId(res, requestId);
    }

    // Protected pages handle sensitive data. Apply a strict nonce-based CSP.
    const nonce = generateCspNonce();
    const cspHeader = buildProtectedCsp(nonce);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-request-id', requestId);
    requestHeaders.set('x-shipped-locale', getPreferredLocale(request));
    requestHeaders.set('x-shipped-callback-url', protectedCallbackUrl);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', cspHeader);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('x-request-id', requestId);
    // Avoid caching personalized HTML at intermediaries.
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    observeProxyLatencyMs('protected', Date.now() - startedAt);
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  requestHeaders.set('x-shipped-locale', getPreferredLocale(request));
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('x-request-id', requestId);
  return response;
}

// Next.js requires this object to be statically analyzable in the proxy file.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
