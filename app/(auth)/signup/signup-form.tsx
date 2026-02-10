'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/auth-client';
import type { Locale } from '@/lib/locale';
import { m } from '@/lib/messages';
import { isValidEmail } from '@/lib/validation/email';
import { mapSignUpError } from '@/lib/auth/ui-errors';

export default function SignupForm({
  callbackUrl,
  initialLocale,
}: {
  callbackUrl: string;
  initialLocale: Locale;
}) {
  const router = useRouter();

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

      const result = await signUp.email({
        name: normalizedName,
        email: normalizedEmail,
        password,
        callbackURL: callbackUrl,
      });
      if (result.error) {
        const mapped = mapSignUpError(result.error, {
          nameRequired: t.nameRequired,
          invalidEmail: t.invalidEmail,
          passwordRequired: t.passwordRequired,
          passwordMinError: t.passwordMinError,
          signupFailedFallback: t.signupFailedFallback,
          signupTrySignInHint: t.signupTrySignInHint,
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

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t.signUpTitle}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t.alreadyHaveAccount}{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            {m(locale).nav.signIn}
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6" data-testid="signup-form" noValidate>
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/50 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t.fullName}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            {fieldErrors.name && (
              <p id="name-error" className="mt-1 text-xs text-red-600 dark:text-red-300">
                {fieldErrors.name}
              </p>
            )}
          </div>

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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t.passwordMinHint}</p>
            {fieldErrors.password && (
              <p id="password-error" className="mt-1 text-xs text-red-600 dark:text-red-300">
                {fieldErrors.password}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? t.creatingAccount : t.createAccountButton}
        </button>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          {t.bySigningUp}{' '}
          <Link href="/terms" className="text-blue-600 hover:text-blue-500">
            {t.termsOfService}
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
            {t.privacyPolicy}
          </Link>
        </p>
      </form>
    </div>
  );
}
