import type { Metadata } from 'next';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for NextJS Bootstrapped Shipped.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Privacy Policy',
    description: 'Privacy policy for NextJS Bootstrapped Shipped.',
    url: '/privacy',
  },
};

export default async function PrivacyPage() {
  const locale = await getRequestLocale();
  const t = m(locale).legal;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-bold">{t.privacyTitle}</h1>
      <p className="text-muted-foreground">{t.boilerplate}</p>
    </main>
  );
}
