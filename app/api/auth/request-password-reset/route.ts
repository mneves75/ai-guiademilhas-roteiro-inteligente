import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isValidEmail } from '@/lib/validation/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const redirectTo = typeof body?.redirectTo === 'string' ? body.redirectTo : undefined;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid or missing email address' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    // Always return 200 to prevent user enumeration.
    // Log server-side if Supabase reports an error.
    if (error) {
      console.error('[request-password-reset] Supabase error:', error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[request-password-reset] Unexpected error:', err);
    return NextResponse.json({ ok: true });
  }
}
