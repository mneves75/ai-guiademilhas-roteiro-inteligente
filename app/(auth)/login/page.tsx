import LoginForm from './login-form';
import { normalizeCallbackUrl } from '@/lib/security/redirect';
import { getRequestLocale } from '@/lib/locale-server';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; redirect?: string }>;
}) {
  const { callbackUrl: callbackUrlParam, redirect } = await searchParams;
  const callbackUrl = normalizeCallbackUrl(callbackUrlParam ?? redirect);
  const locale = await getRequestLocale();

  return <LoginForm callbackUrl={callbackUrl} initialLocale={locale} />;
}
