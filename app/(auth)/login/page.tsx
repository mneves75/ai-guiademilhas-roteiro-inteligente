import LoginForm from './login-form';
import { normalizeCallbackUrl } from '@/lib/security/redirect';
import { getRequestLocale } from '@/lib/locale-server';
import { normalizeFunnelSource } from '@/lib/analytics/funnel';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; redirect?: string; source?: string }>;
}) {
  const { callbackUrl: callbackUrlParam, redirect, source } = await searchParams;
  const callbackUrl = normalizeCallbackUrl(callbackUrlParam ?? redirect);
  const funnelSource = normalizeFunnelSource(source);
  const locale = await getRequestLocale();

  return <LoginForm callbackUrl={callbackUrl} funnelSource={funnelSource} initialLocale={locale} />;
}
