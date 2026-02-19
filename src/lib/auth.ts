import 'server-only';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type Session = {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string | null;
    image: string | null;
  };
};

const E2E_AUTH_COOKIE_NAME = 'e2e_auth';

async function getPlaywrightE2ESession(): Promise<Session | null> {
  if (process.env.NODE_ENV === 'production') return null;
  if (process.env.PLAYWRIGHT_E2E !== '1') return null;

  try {
    const cookieStore = await cookies();
    const e2eAuthCookie = cookieStore.get(E2E_AUTH_COOKIE_NAME)?.value;
    if (e2eAuthCookie !== '1') return null;
  } catch {
    return null;
  }

  return {
    user: {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'e2e@example.com',
      name: 'E2E User',
      role: null,
      image: null,
    },
  };
}

export async function getSession(): Promise<Session | null> {
  const e2eSession = await getPlaywrightE2ESession();
  if (e2eSession) return e2eSession;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  return {
    user: {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
      role: user.app_metadata?.role ?? user.user_metadata?.role ?? null,
      image: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
    },
  };
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}

function getAdminEmailAllowlist(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();
  const adminEmails = getAdminEmailAllowlist();
  if (!adminEmails.has(session.user.email.toLowerCase()) && session.user.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  return session;
}
