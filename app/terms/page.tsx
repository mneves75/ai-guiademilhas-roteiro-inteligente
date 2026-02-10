import type { Metadata } from 'next';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { publicAlternates } from '@/lib/seo/public-alternates';
import { publicPathname } from '@/lib/locale-routing';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = m(locale).legal;
  const canonical = publicPathname(locale, '/terms');

  return {
    title: t.termsTitle,
    description: t.boilerplate,
    alternates: publicAlternates(locale, '/terms'),
    openGraph: {
      title: t.termsTitle,
      description: t.boilerplate,
      url: canonical,
    },
  };
}

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
