'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import type { Locale } from '@/lib/locale';
import { m } from '@/lib/messages';
import { isValidEmail } from '@/lib/validation/email';
import { mapSignInError } from '@/lib/auth/ui-errors';
import { parseBodyFieldErrors } from '@/lib/auth/error-utils';

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
  const [magicEmail, setMagicEmail] = useState('');
  const [magicFieldError, setMagicFieldError] = useState<string>('');
  const [magicLoading, setMagicLoading] = useState(false);

  const t = m(locale).auth;

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

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    setMagicFieldError('');
    setMagicLoading(true);
    try {
      const normalized = magicEmail.trim().toLowerCase();
      if (!normalized) {
        setMagicFieldError(t.emailRequired);
        return;
      }
      if (!isValidEmail(normalized)) {
        setMagicFieldError(t.invalidEmail);
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
          setMagicFieldError(t.invalidEmail);
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
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t.signInTitle}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t.or}{' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            {t.createAccount}
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6" data-testid="login-form" noValidate>
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/50 dark:text-red-200">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
            {notice}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            {fieldErrors.email && (
              <p id="email-error" className="mt-1 text-xs text-red-600 dark:text-red-300">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t.password}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            {fieldErrors.password && (
              <p id="password-error" className="mt-1 text-xs text-red-600 dark:text-red-300">
                {fieldErrors.password}
              </p>
            )}
            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-blue-600 hover:text-blue-500"
              >
                {t.forgotPassword}
              </Link>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? t.signingIn : t.signInButton}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-50 px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              {t.oauthContinue}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuthSignIn('google')}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignIn('github')}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            GitHub
          </button>
        </div>
      </form>

      <form onSubmit={handleMagicLink} className="space-y-3 rounded-lg border p-4" noValidate>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.magicLinkTitle}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{t.magicLinkHint}</p>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="magic-email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t.magicLinkEmail}
          </label>
          <input
            id="magic-email"
            name="magic-email"
            type="email"
            autoComplete="email"
            required
            value={magicEmail}
            onChange={(e) => setMagicEmail(e.target.value)}
            aria-invalid={!!magicFieldError}
            aria-describedby={magicFieldError ? 'magic-email-error' : undefined}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          {magicFieldError && (
            <p id="magic-email-error" className="mt-1 text-xs text-red-600 dark:text-red-300">
              {magicFieldError}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={magicLoading}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          {magicLoading ? t.sendingLink : t.magicLinkButton}
        </button>
      </form>
    </div>
  );
}
