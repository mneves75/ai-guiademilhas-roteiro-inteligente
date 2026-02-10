import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { SocialProof } from '@/components/landing/social-proof';
import { Features } from '@/components/landing/features';
import { Showcase } from '@/components/landing/showcase';
import { TechStack } from '@/components/landing/tech-stack';
import { Testimonials } from '@/components/landing/testimonials';
import { Pricing } from '@/components/landing/pricing';
import { FAQ } from '@/components/landing/faq';
import { FinalCTA } from '@/components/landing/final-cta';
import { Footer } from '@/components/landing/footer';
import { RevealOnScroll } from '@/components/reveal-on-scroll';
import { JsonLd } from '@/components/json-ld';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { resolvePublicOrigin } from '@/lib/seo/base-url';
import type { Metadata } from 'next';
import { publicAlternates } from '@/lib/seo/public-alternates';
import { publicPathname } from '@/lib/locale-routing';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = m(locale).landing.meta;
  const canonical = publicPathname(locale, '/');

  return {
    title: t.title,
    description: t.description,
    alternates: {
      ...publicAlternates(locale, '/'),
      types: {
        'application/rss+xml': '/rss.xml',
      },
    },
    openGraph: {
      title: t.title,
      description: t.description,
      type: 'website',
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title: t.title,
      description: t.description,
    },
  };
}

export default async function HomePage() {
  const locale = await getRequestLocale();
  const t = m(locale);
  const url = resolvePublicOrigin();
  const appName = 'NextJS Bootstrapped Shipped';
  const canonicalPath = publicPathname(locale, '/');

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
      {/* Skip link for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[14px] focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg"
      >
        {t.landing.skipToContent}
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Hero />
        <SocialProof />
        <RevealOnScroll>
          <Features />
        </RevealOnScroll>
        <Showcase />
        <TechStack />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
