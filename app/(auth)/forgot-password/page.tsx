import ForgotPasswordForm from './forgot-password-form';
import { getRequestLocale } from '@/lib/locale-server';

export default async function ForgotPasswordPage() {
  const locale = await getRequestLocale();
  return <ForgotPasswordForm initialLocale={locale} />;
}
