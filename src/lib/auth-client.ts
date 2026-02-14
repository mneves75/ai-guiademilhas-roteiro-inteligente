'use client';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export { supabase as authClient };

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, name: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { name, full_name: name } },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function signInWithOAuth(provider: 'google' | 'github', redirectTo?: string) {
  return supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: redirectTo ?? `${window.location.origin}/api/auth/callback` },
  });
}

export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function getUser() {
  return supabase.auth.getUser();
}
