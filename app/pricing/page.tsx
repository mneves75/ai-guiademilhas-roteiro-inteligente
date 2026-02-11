import Link from 'next/link';
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { JsonLd } from '@/components/json-ld';
import { LanguageSwitcher } from '@/components/language-switcher';
import { getLandingContent } from '@/content/landing';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { getLocalizedPlans } from '@/lib/plan-catalog-localized';
import { resolvePublicOrigin } from '@/lib/seo/base-url';
import { publicAlternates } from '@/lib/seo/public-alternates';
import { publicPathname } from '@/lib/locale-routing';
import { LANDING_PLANNER_SOURCE, withFunnelSource } from '@/lib/analytics/funnel';
import { plannerLoginHref, plannerSignupHref } from '@/lib/planner/navigation';
import { buildLoginRedirectHref } from '@/lib/security/redirect';
import { buildPricingOfferCatalogJsonLd } from '@/lib/seo/structured-data';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = m(locale).pricingPage;
  const canonical = publicPathname(locale, '/pricing');
  const ogLocale = locale === 'pt-BR' ? 'pt_BR' : 'en_US';

  return {
    title: t.title,
    description: t.subtitle,
    alternates: publicAlternates(locale, '/pricing'),
    openGraph: {
      title: t.title,
      description: t.subtitle,
      siteName: locale === 'pt-BR' ? 'Guia de Milhas' : 'Miles Guide',
      locale: ogLocale,
      url: canonical,
      images: [
        {
          url: '/api/og',
          width: 1200,
          height: 630,
          alt: locale === 'pt-BR' ? 'Guia de Milhas' : 'Miles Guide',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t.title,
      description: t.subtitle,
      images: ['/api/og'],
    },
  };
}

export default async function PricingPage() {
  const locale = await getRequestLocale();
  const t = m(locale);
  const content = getLandingContent(locale);
  const plans = getLocalizedPlans(locale);
  const url = resolvePublicOrigin();
  const pricingPath = publicPathname(locale, '/pricing');
  const signupHref = plannerSignupHref(LANDING_PLANNER_SOURCE);
  const loginHref = plannerLoginHref(LANDING_PLANNER_SOURCE);
  const billingLoginHref = withFunnelSource(
    buildLoginRedirectHref('/dashboard/billing', { defaultPath: '/dashboard/billing' }),
    LANDING_PLANNER_SOURCE
  );
  const homePath = publicPathname(locale, '/');
  const offerCatalogJsonLd = buildPricingOfferCatalogJsonLd({
    locale,
    plans,
    signupUrl: `${url}${signupHref}`,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: t.pricingPage.title,
          url: `${url}${pricingPath}`,
        }}
      />
      <JsonLd data={offerCatalogJsonLd} />
      <header className="glass-header sticky top-0 z-50 w-full border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={homePath} className="text-lg font-semibold">
            {content.appName}
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button asChild variant="ghost" size="sm">
              <Link href={loginHref}>{t.nav.signIn}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={signupHref}>{t.nav.getStarted}</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-12 sm:px-6">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight">{t.pricingPage.title}</h1>
          <p className="text-muted-foreground">{t.pricingPage.subtitle}</p>
          <div className="flex justify-center gap-2 pt-2">
            <Button asChild>
              <Link href={signupHref}>{t.pricingPage.getStarted}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={billingLoginHref}>{t.pricingPage.manageBilling}</Link>
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
                    <Link href={signupHref}>{t.pricingPage.startWith(plan.name)}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground sm:px-6">
          &copy; {new Date().getFullYear()} {content.appName}
        </div>
      </footer>
    </div>
  );
}
