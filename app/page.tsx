import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { SocialProof } from '@/components/landing/social-proof';
import { Features } from '@/components/landing/features';
import { TechStack } from '@/components/landing/tech-stack';
import { Pricing } from '@/components/landing/pricing';
import { FAQ } from '@/components/landing/faq';
import { FinalCTA } from '@/components/landing/final-cta';
import { Footer } from '@/components/landing/footer';
import { RevealOnScroll } from '@/components/reveal-on-scroll';
import { JsonLd } from '@/components/json-ld';

export default function HomePage() {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? 'https://shipped.dev';
  const appName = 'NextJS Bootstrapped Shipped';

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: appName,
          url,
        }}
      />
      {/* Skip link for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[14px] focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Hero />
        <SocialProof />
        <RevealOnScroll>
          <Features />
        </RevealOnScroll>
        <TechStack />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
