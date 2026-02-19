import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Supabase password reset flow: user clicked the email link which exchanged
    // the code for a session via /api/auth/callback. By this point the user has
    // an active session, so updateUser() works.
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      // If no session exists (e.g. user navigated directly), updateUser fails.
      const status =
        error.message.includes('not authenticated') ||
        error.message.includes('Auth session missing')
          ? 401
          : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[reset-password] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
