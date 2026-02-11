import ResetPasswordForm from './reset-password-form';
import { getRequestLocale } from '@/lib/locale-server';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  const locale = await getRequestLocale();

  return (
    <ResetPasswordForm token={token ?? ''} errorParam={error ?? null} initialLocale={locale} />
  );
}
