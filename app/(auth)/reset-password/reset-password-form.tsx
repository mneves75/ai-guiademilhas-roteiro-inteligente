'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/locale';
import { m } from '@/lib/messages';
import { parseBodyFieldErrors } from '@/lib/auth/error-utils';

export default function ResetPasswordForm({
  token,
  errorParam,
  initialLocale,
}: {
  token: string;
  errorParam: string | null;
  initialLocale: Locale;
}) {
  const router = useRouter();

  const [locale] = useState<Locale>(initialLocale);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});

  const t = m(locale).auth;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    setFieldErrors({});

    if (!token) {
      setError(t.resetTokenMissing);
      return;
    }
    const nextFieldErrors: { password?: string; confirm?: string } = {};
    if (!password) nextFieldErrors.password = t.passwordRequired;
    else if (password.length < 8) nextFieldErrors.password = t.passwordMinError;
    if (!confirm) nextFieldErrors.confirm = t.passwordRequired;
    else if (confirm.length < 8) nextFieldErrors.confirm = t.passwordMinError;
    if (password && confirm && password !== confirm) nextFieldErrors.confirm = t.passwordsDontMatch;
    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password, token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.message ?? data?.error;
        const parsed = parseBodyFieldErrors(msg);
        if (parsed.newPassword) {
          setFieldErrors({ password: t.passwordMinError });
        } else {
          setError(t.resetFailedFallback);
        }
        return;
      }
      setNotice(t.resetSuccessRedirecting);
      setTimeout(() => {
        router.push('/login');
        router.refresh();
      }, 800);
    } catch {
      setError(t.resetFailedFallback);
    } finally {
      setLoading(false);
    }
  }

  if (errorParam === 'INVALID_TOKEN') {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/50 dark:text-red-200">
          {t.invalidResetLink}
        </div>
        <Link
          href="/forgot-password"
          className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          {t.requestNewResetLink}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t.chooseNewPassword}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t.setNewPasswordHint}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t.newPassword}
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
          {fieldErrors.password && (
            <p id="password-error" className="mt-1 text-xs text-red-600 dark:text-red-300">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirm"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t.confirmPassword}
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={!!fieldErrors.confirm}
            aria-describedby={fieldErrors.confirm ? 'confirm-error' : undefined}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          {fieldErrors.confirm && (
            <p id="confirm-error" className="mt-1 text-xs text-red-600 dark:text-red-300">
              {fieldErrors.confirm}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? t.resetting : t.resetPasswordButton}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
          {t.backToSignIn}
        </Link>
      </p>
    </div>
  );
}
