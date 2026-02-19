import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';

export type SessionCookie = { name: string; value: string; options: Record<string, unknown> };

/**
 * Refresh Supabase auth tokens from request cookies.
 *
 * Returns the refreshed cookies to be applied to whatever response the caller
 * builds. This decouples session refresh from response creation — the proxy
 * controls its own response lifecycle while delegating auth to this module.
 */
export async function refreshSession(request: NextRequest): Promise<{ cookies: SessionCookie[] }> {
  let cookies: SessionCookie[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookies = cookiesToSet;
        },
      },
    }
  );

  await supabase.auth.getUser();
  return { cookies };
}
