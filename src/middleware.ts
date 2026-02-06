import { NextResponse, type NextRequest } from 'next/server';

// Public routes should be accessible without a session cookie.
// Keep API allowlist tight: only endpoints that must be callable anonymously.
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/pricing',
  '/emails',
  '/blog',
  '/invite',
  '/api/auth',
  '/api/og',
  '/api/invitations/accept',
  '/api/stripe/webhook',
];
const authRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  const isPublicRoute = publicRoutes.some((route) => {
    if (pathname === route) return true;
    // Treat "directories" as public too (e.g. /blog/*, /invite/*).
    return pathname.startsWith(`${route}/`);
  });

  // Check for session cookie
  const sessionCookie = request.cookies.get('better-auth.session_token');
  const isAuthenticated = !!sessionCookie?.value;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && authRoutes.some((route) => pathname === route)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
