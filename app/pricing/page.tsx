import Link from 'next/link';
import type { Metadata } from 'next';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { JsonLd } from '@/components/json-ld';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { getLocalizedPlans } from '@/lib/plan-catalog-localized';
import { resolvePublicOrigin } from '@/lib/seo/base-url';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Plans and pricing for NextJS Bootstrapped Shipped.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing',
    description: 'Plans and pricing for NextJS Bootstrapped Shipped.',
    url: '/pricing',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing',
    description: 'Plans and pricing for NextJS Bootstrapped Shipped.',
  },
};

export default async function PricingPage() {
  const locale = await getRequestLocale();
  const t = m(locale);
  const plans = getLocalizedPlans(locale);
  const url = resolvePublicOrigin();

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: t.pricingPage.title,
          url: `${url}/pricing`,
        }}
      />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-12 sm:px-6">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight">{t.pricingPage.title}</h1>
          <p className="text-muted-foreground">{t.pricingPage.subtitle}</p>
          <div className="flex justify-center gap-2 pt-2">
            <Button asChild>
              <Link href="/signup">{t.pricingPage.getStarted}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login?callbackUrl=/dashboard/billing">
                {t.pricingPage.manageBilling}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const highlighted = plan.id === 'pro';
            return (
              <Card key={plan.id} className={highlighted ? 'border-primary shadow-lg' : ''}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant={highlighted ? 'default' : 'outline'} className="w-full">
                    <Link href="/signup">{t.pricingPage.startWith(plan.name)}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
