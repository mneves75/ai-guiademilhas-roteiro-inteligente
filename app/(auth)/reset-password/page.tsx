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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <ResetPasswordForm token={token ?? ''} errorParam={error ?? null} initialLocale={locale} />
    </div>
  );
}
