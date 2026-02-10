import type { Metadata } from 'next';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for NextJS Bootstrapped Shipped.',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'Terms of Service',
    description: 'Terms of service for NextJS Bootstrapped Shipped.',
    url: '/terms',
  },
};

export default async function TermsPage() {
  const locale = await getRequestLocale();
  const t = m(locale).legal;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-bold">{t.termsTitle}</h1>
      <p className="text-muted-foreground">{t.boilerplate}</p>
    </main>
  );
}
