import { NextRequest, NextResponse } from 'next/server';

const E2E_AUTH_COOKIE_NAME = 'e2e_auth';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (process.env.PLAYWRIGHT_E2E !== '1') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const isHttps = forwardedProto === 'https' || request.nextUrl.protocol === 'https:';

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: E2E_AUTH_COOKIE_NAME,
    value: '1',
    httpOnly: true,
    sameSite: 'lax',
    // Playwright full matrix can run local production server over plain HTTP.
    // Use request protocol instead of NODE_ENV to keep cookie delivery deterministic.
    secure: isHttps,
    path: '/',
    maxAge: 60 * 60,
  });
  return response;
}
