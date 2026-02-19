import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isValidEmail } from '@/lib/validation/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const callbackURL = typeof body?.callbackURL === 'string' ? body.callbackURL : '/dashboard';

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid or missing email address' }, { status: 400 });
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const emailRedirectTo = `${origin}/api/auth/callback?next=${encodeURIComponent(callbackURL)}`;

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });

    // Always return 200 to prevent user enumeration.
    if (error) {
      console.error('[magic-link] Supabase error:', error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[magic-link] Unexpected error:', err);
    return NextResponse.json({ ok: true });
  }
}
