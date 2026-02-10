import SignupForm from './signup-form';
import { normalizeCallbackUrl } from '@/lib/security/redirect';
import { getRequestLocale } from '@/lib/locale-server';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; redirect?: string }>;
}) {
  const { callbackUrl: callbackUrlParam, redirect } = await searchParams;
  const callbackUrl = normalizeCallbackUrl(callbackUrlParam ?? redirect);
  const locale = await getRequestLocale();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <SignupForm callbackUrl={callbackUrl} initialLocale={locale} />
    </div>
  );
}
