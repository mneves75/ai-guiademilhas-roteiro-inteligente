'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { Locale } from '@/lib/locale';
import { m } from '@/lib/messages';
import { parseBodyFieldErrors } from '@/lib/auth/error-utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

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
      <div className="space-y-6">
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {t.invalidResetLink}
        </div>
        <Button asChild className="w-full">
          <Link href="/forgot-password">{t.requestNewResetLink}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.chooseNewPassword}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.setNewPasswordHint}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
        )}
        {notice && (
          <div className="rounded-md bg-primary/10 p-3 text-sm text-foreground">{notice}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">{t.newPassword}</Label>
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
          {fieldErrors.password && (
            <p id="password-error" className="text-xs text-destructive">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">{t.confirmPassword}</Label>
          <Input
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
          />
          {fieldErrors.confirm && (
            <p id="confirm-error" className="text-xs text-destructive">
              {fieldErrors.confirm}
            </p>
          )}
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="animate-spin" />}
          {loading ? t.resetting : t.resetPasswordButton}
        </Button>
      </form>

      <p className="text-center text-sm">
        <Link href="/login" className="font-medium text-muted-foreground hover:text-foreground">
          {t.backToSignIn}
        </Link>
      </p>
    </div>
  );
}
