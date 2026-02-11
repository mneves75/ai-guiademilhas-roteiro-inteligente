'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { signIn } from '@/lib/auth-client';
import type { Locale } from '@/lib/locale';
import { m } from '@/lib/messages';
import { isValidEmail } from '@/lib/validation/email';
import { mapSignInError } from '@/lib/auth/ui-errors';
import { parseBodyFieldErrors } from '@/lib/auth/error-utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function LoginForm({
  callbackUrl,
  initialLocale,
}: {
  callbackUrl: string;
  initialLocale: Locale;
}) {
  const router = useRouter();

  const [locale] = useState<Locale>(initialLocale);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  const t = m(locale).auth;
  const signupHref = `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    setFieldErrors({});
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const nextFieldErrors: { email?: string; password?: string } = {};

      if (!normalizedEmail) nextFieldErrors.email = t.emailRequired;
      else if (!isValidEmail(normalizedEmail)) nextFieldErrors.email = t.invalidEmail;

      if (!password) nextFieldErrors.password = t.passwordRequired;

      if (Object.keys(nextFieldErrors).length) {
        setFieldErrors(nextFieldErrors);
        return;
      }

      const result = await signIn.email({
        email: normalizedEmail,
        password,
        callbackURL: callbackUrl,
      });
      if (result.error) {
        const mapped = mapSignInError(result.error, {
          invalidEmail: t.invalidEmail,
          passwordRequired: t.passwordRequired,
          loginFailedFallback: t.loginFailedFallback,
        });
        if (mapped.fieldErrors) setFieldErrors(mapped.fieldErrors);
        if (mapped.globalError) setError(mapped.globalError);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError(t.unexpectedError);
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuthSignIn(provider: 'google' | 'github') {
    try {
      await signIn.social({ provider, callbackURL: callbackUrl });
    } catch {
      setError(t.oauthLoginFailed);
    }
  }

  async function handleMagicLink() {
    setError('');
    setNotice('');
    setMagicLoading(true);
    try {
      const normalized = email.trim().toLowerCase();
      if (!normalized) {
        setFieldErrors({ email: t.emailRequired });
        return;
      }
      if (!isValidEmail(normalized)) {
        setFieldErrors({ email: t.invalidEmail });
        return;
      }
      const res = await fetch('/api/auth/sign-in/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalized,
          callbackURL: callbackUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.message ?? data?.error;
        const parsed = parseBodyFieldErrors(msg);
        if (parsed.email) {
          setFieldErrors({ email: t.invalidEmail });
        } else {
          setError(t.magicLinkSendFailed);
        }
        return;
      }
      setNotice(t.magicLinkSent);
    } catch {
      setError(t.magicLinkSendFailed);
    } finally {
      setMagicLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.signInTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.or}{' '}
          <Link href={signupHref} className="font-medium text-primary hover:text-primary/80">
            {t.createAccount}
          </Link>
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}
      {notice && (
        <div className="rounded-md bg-primary/10 p-3 text-sm text-foreground">{notice}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" onClick={() => handleOAuthSignIn('google')}>
          Google
        </Button>
        <Button type="button" variant="outline" onClick={() => handleOAuthSignIn('github')}>
          GitHub
        </Button>
      </div>

      <div className="relative flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">{t.oauthContinue}</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form" noValidate>
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
          />
          {fieldErrors.password && (
            <p id="password-error" className="text-xs text-destructive">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleMagicLink}
            disabled={magicLoading}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {magicLoading ? t.sendingLink : t.magicLinkButton}
          </button>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {t.forgotPassword}
          </Link>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="animate-spin" />}
          {loading ? t.signingIn : t.signInButton}
        </Button>
      </form>
    </div>
  );
}
