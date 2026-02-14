'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { signUp } from '@/lib/auth-client';
import type { AuthError } from '@supabase/supabase-js';
import type { Locale } from '@/lib/locale';
import { m } from '@/lib/messages';
import { isValidEmail } from '@/lib/validation/email';
import { mapSignUpError } from '@/lib/auth/ui-errors';
import { publicPathname } from '@/lib/locale-routing';
import { plannerFunnelEvents, type FunnelSource, withFunnelSource } from '@/lib/analytics/funnel';
import {
  capturePlannerFunnelEvent,
  rememberPlannerFunnelSource,
} from '@/lib/analytics/funnel-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function SignupForm({
  callbackUrl,
  funnelSource,
  initialLocale,
}: {
  callbackUrl: string;
  funnelSource: FunnelSource | null;
  initialLocale: Locale;
}) {
  const router = useRouter();

  const [hydrated, setHydrated] = useState(false);
  const [locale] = useState<Locale>(initialLocale);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const t = m(locale).auth;
  const termsPath = publicPathname(locale, '/terms');
  const privacyPath = publicPathname(locale, '/privacy');
  const loginHref = withFunnelSource(
    `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    funnelSource
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!funnelSource) return;
    rememberPlannerFunnelSource(funnelSource);
    capturePlannerFunnelEvent(plannerFunnelEvents.authViewed, {
      source: funnelSource,
      step: 'signup',
      locale,
    });
  }, [funnelSource, locale]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      const normalizedName = name.trim();
      const normalizedEmail = email.trim().toLowerCase();
      const nextFieldErrors: { name?: string; email?: string; password?: string } = {};

      if (!normalizedName) nextFieldErrors.name = t.nameRequired;

      if (!normalizedEmail) nextFieldErrors.email = t.emailRequired;
      else if (!isValidEmail(normalizedEmail)) nextFieldErrors.email = t.invalidEmail;

      if (!password) nextFieldErrors.password = t.passwordRequired;
      else if (password.length < 8) nextFieldErrors.password = t.passwordMinError;

      if (Object.keys(nextFieldErrors).length) {
        setFieldErrors(nextFieldErrors);
        return;
      }

      const { error: signUpError } = await signUp(normalizedEmail, password, normalizedName);
      if (signUpError) {
        const mapped = mapSignUpError(
          { message: (signUpError as AuthError).message, code: (signUpError as AuthError).code },
          {
            nameRequired: t.nameRequired,
            invalidEmail: t.invalidEmail,
            passwordRequired: t.passwordRequired,
            passwordMinError: t.passwordMinError,
            signupFailedFallback: t.signupFailedFallback,
            signupTrySignInHint: t.signupTrySignInHint,
          }
        );
        if (mapped.fieldErrors) setFieldErrors(mapped.fieldErrors);
        if (mapped.globalError) setError(mapped.globalError);
      } else {
        if (funnelSource) {
          capturePlannerFunnelEvent(plannerFunnelEvents.authCompleted, {
            source: funnelSource,
            step: 'signup',
            method: 'email_password',
            locale,
          });
        }
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError(t.unexpectedError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.signUpTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.alreadyHaveAccount}{' '}
          <Link href={loginHref} className="font-medium text-primary hover:text-primary/80">
            {m(locale).nav.signIn}
          </Link>
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        method="post"
        className="space-y-4"
        data-testid="signup-form"
        noValidate
      >
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">{t.fullName}</Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
          />
          {fieldErrors.name && (
            <p id="name-error" className="text-xs text-destructive">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t.email}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          />
          {fieldErrors.email && (
            <p id="email-error" className="text-xs text-destructive">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t.password}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
          />
          <p className="text-xs text-muted-foreground">{t.passwordMinHint}</p>
          {fieldErrors.password && (
            <p id="password-error" className="text-xs text-destructive">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <Button type="submit" disabled={loading || !hydrated} className="w-full">
          {loading && <Loader2 className="animate-spin" />}
          {loading ? t.creatingAccount : t.createAccountButton}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {t.bySigningUp}{' '}
          <Link href={termsPath} className="text-primary hover:text-primary/80">
            {t.termsOfService}
          </Link>{' '}
          {m(locale).common.and}{' '}
          <Link href={privacyPath} className="text-primary hover:text-primary/80">
            {t.privacyPolicy}
          </Link>
        </p>
      </form>
    </div>
  );
}
