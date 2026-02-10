'use server';

import { cookies } from 'next/headers';
import { LOCALE_COOKIE, normalizeLocale, type Locale } from './locale';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function shouldUseSecureCookies(): boolean {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_BASE_URL ??
    process.env.BETTER_AUTH_URL;
  if (!raw) return process.env.NODE_ENV === 'production';

  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();

    // Avoid setting `Secure` cookies on localhost, even in production builds (e.g. Playwright / preview envs).
    // Browsers won't persist Secure cookies over plain HTTP.
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return false;

    return url.protocol === 'https:';
  } catch {
    return process.env.NODE_ENV === 'production';
  }
}

export async function setLocaleAction(nextLocale: Locale): Promise<void> {
  const locale = normalizeLocale(nextLocale);
  const c = await cookies();

  c.set(LOCALE_COOKIE, locale, {
    path: '/',
    sameSite: 'lax',
    maxAge: ONE_YEAR_SECONDS,
    httpOnly: true,
    // Safari/WebKit will not persist `Secure` cookies on plain HTTP (even on localhost).
    secure: shouldUseSecureCookies(),
  });
}
