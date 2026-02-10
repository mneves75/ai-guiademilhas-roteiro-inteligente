import ForgotPasswordForm from './forgot-password-form';
import { getRequestLocale } from '@/lib/locale-server';

export default async function ForgotPasswordPage() {
  const locale = await getRequestLocale();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <ForgotPasswordForm initialLocale={locale} />
    </div>
  );
}
