import Link from 'next/link';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { JsonLd } from '@/components/json-ld';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/language-switcher';
import { getLandingContent } from '@/content/landing';
import { getAuth } from '@/lib/auth';
import { publicPathname } from '@/lib/locale-routing';
import { getRequestLocale } from '@/lib/locale-server';
import { plannerLoginHref, plannerSignupHref, PLANNER_PATH } from '@/lib/planner/navigation';
import { LANDING_PLANNER_SOURCE } from '@/lib/analytics/funnel';
import { publicAlternates } from '@/lib/seo/public-alternates';
import { resolvePublicOrigin } from '@/lib/seo/base-url';
import { buildFaqPageJsonLd, buildPlannerServiceJsonLd } from '@/lib/seo/structured-data';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const content = getLandingContent(locale);
  const canonical = publicPathname(locale, '/');
  const ogLocale = locale === 'pt-BR' ? 'pt_BR' : 'en_US';

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: {
      ...publicAlternates(locale, '/'),
      types: {
        'application/rss+xml': '/rss.xml',
      },
    },
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      type: 'website',
      siteName: content.appName,
      locale: ogLocale,
      url: canonical,
      images: [
        {
          url: '/api/og',
          width: 1200,
          height: 630,
          alt: content.appName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.metaTitle,
      description: content.metaDescription,
      images: ['/api/og'],
    },
  };
}

export default async function HomePage() {
  const locale = await getRequestLocale();
  const content = getLandingContent(locale);
  const url = resolvePublicOrigin();
  const appName = content.appName;
  const canonicalPath = publicPathname(locale, '/');
  const plannerPath = PLANNER_PATH;
  const auth = getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session) {
    redirect(plannerPath);
  }
  const signupHref = plannerSignupHref(LANDING_PLANNER_SOURCE);
  const loginHref = plannerLoginHref(LANDING_PLANNER_SOURCE);
  const primaryHref = signupHref;
  const faqJsonLd = buildFaqPageJsonLd(content.faqs);
  const plannerServiceJsonLd = buildPlannerServiceJsonLd({
    appName,
    siteUrl: url,
    locale,
    description: content.metaDescription,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: appName,
          url: `${url}${canonicalPath}`,
        }}
      />
      <JsonLd data={plannerServiceJsonLd} />
      <JsonLd data={faqJsonLd} />
      {/* Skip link for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[14px] focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg"
      >
        {content.skipToContent}
      </a>
      <header className="glass-header sticky top-0 z-50 w-full border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={publicPathname(locale, '/')} className="text-lg font-semibold">
            {appName}
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button asChild variant="ghost" size="sm">
              <Link href={loginHref}>{content.loginCta}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={signupHref}>{content.finalCta}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        <section className="hero-glow border-b py-20 md:py-28">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 text-center sm:px-6">
            <span className="glass-card rounded-full px-4 py-2 text-xs font-medium text-muted-foreground">
              {content.badge}
            </span>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              {content.headline}
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">{content.subheadline}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="px-8">
                <Link href={primaryHref}>{content.primaryCta}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8">
                <Link href={loginHref}>{content.secondaryCta}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{content.proofTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 sm:grid-cols-3">
                {content.proofPoints.map((point) => (
                  <li key={point} className="rounded-lg border bg-muted/20 p-4 text-sm">
                    {point}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <h2 className="mb-6 text-center text-3xl font-bold tracking-tight">{content.howTitle}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {content.howSteps.map((step) => (
              <Card key={step.title}>
                <CardHeader>
                  <CardTitle>{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <h2 className="mb-6 text-center text-3xl font-bold tracking-tight">{content.faqTitle}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {content.faqs.map((faq) => (
              <Card key={faq.question}>
                <CardHeader>
                  <CardTitle className="text-base">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t bg-muted/20 py-14">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">{content.finalTitle}</h2>
            <p className="max-w-2xl text-muted-foreground">{content.finalSubtitle}</p>
            <Button asChild size="lg" className="px-8">
              <Link href={primaryHref}>{content.finalCta}</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
