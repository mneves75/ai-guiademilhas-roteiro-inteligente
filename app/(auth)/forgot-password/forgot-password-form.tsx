'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import type { Locale } from '@/lib/locale';
import { m } from '@/lib/messages';
import { parseBodyFieldErrors } from '@/lib/auth/error-utils';
import { isValidEmail } from '@/lib/validation/email';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordForm({ initialLocale }: { initialLocale: Locale }) {
  const [locale] = useState<Locale>(initialLocale);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fieldError, setFieldError] = useState<string>('');

  const t = m(locale).auth;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    setFieldError('');
    setLoading(true);

    try {
      const normalized = email.trim().toLowerCase();
      if (!normalized) {
        setFieldError(t.emailRequired);
        return;
      }
      if (!isValidEmail(normalized)) {
        setFieldError(t.invalidEmail);
        return;
      }

      const redirectTo = `${window.location.origin}/reset-password`;
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized, redirectTo }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.message ?? data?.error;
        const parsed = parseBodyFieldErrors(msg);
        if (parsed.email) {
          setFieldError(t.invalidEmail);
        } else {
          setError(t.requestResetFailedFallback);
        }
        return;
      }

      setNotice(t.requestResetSent);
    } catch {
      setError(t.requestResetFailedFallback);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t.resetTitle}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.resetHint}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-md bg-primary/10 p-3 text-sm text-foreground">
            {notice}
          </div>
        )}

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
            aria-invalid={!!fieldError}
            aria-describedby={fieldError ? 'email-error' : undefined}
          />
          {fieldError && (
            <p id="email-error" className="text-xs text-destructive">
              {fieldError}
            </p>
          )}
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="animate-spin" />}
          {loading ? t.sendingResetLink : t.sendResetLink}
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
