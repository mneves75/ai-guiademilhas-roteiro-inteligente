import Link from 'next/link';
import { ArrowRight, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { plannerSignupHref } from '@/lib/planner/navigation';

function BrowserMockup() {
  return (
    <div className="glass-card-elevated mx-auto mt-16 w-full max-w-4xl overflow-hidden rounded-xl">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
          <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
          <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
        </div>
        <div className="mx-auto flex h-6 w-64 items-center justify-center rounded-md bg-muted/50 text-xs text-muted-foreground">
          app.shipped.dev/dashboard
        </div>
      </div>
      {/* Dashboard wireframe */}
      <div className="flex min-h-[280px] bg-background/50 sm:min-h-[340px]">
        {/* Sidebar */}
        <div className="hidden w-48 border-r border-border/30 p-4 sm:block">
          <div className="mb-6 h-5 w-20 rounded bg-foreground/10" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-primary/15" />
            <div className="h-4 w-28 rounded bg-muted-foreground/8" />
            <div className="h-4 w-24 rounded bg-muted-foreground/8" />
            <div className="h-4 w-32 rounded bg-muted-foreground/8" />
            <div className="h-4 w-20 rounded bg-muted-foreground/8" />
          </div>
        </div>
        {/* Main content */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-5 w-28 rounded bg-foreground/10" />
            <div className="h-7 w-24 rounded-[10px] bg-primary/15" />
          </div>
          {/* Stats row */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/30 bg-muted/20 p-3">
                <div className="mb-2 h-3 w-14 rounded bg-muted-foreground/15" />
                <div className="h-5 w-10 rounded bg-foreground/12" />
              </div>
            ))}
          </div>
          {/* Table rows */}
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border/20 bg-muted/10 p-3"
              >
                <div className="h-8 w-8 shrink-0 rounded-full bg-muted-foreground/10" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 rounded bg-foreground/10" />
                  <div className="h-2.5 w-20 rounded bg-muted-foreground/10" />
                </div>
                <div className="h-5 w-14 rounded-full bg-primary/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export async function Hero() {
  const locale = await getRequestLocale();
  const t = m(locale).landing.hero;
  const signupHref = plannerSignupHref();

  return (
    <section className="hero-glow py-28 md:py-36">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center sm:px-6">
        <div className="glass-card flex items-center gap-2 rounded-full px-4 py-1.5 text-sm">
          <span className="text-muted-foreground">{t.badgeOpenSource}</span>
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            v1.0
          </span>
        </div>

        <h1 className="max-w-4xl text-5xl font-bold tracking-[-0.03em] sm:text-6xl md:text-7xl lg:text-[80px]">
          {t.headlinePrefix}
          <span className="gradient-text">{t.headlineEmphasis}</span>
        </h1>

        <p className="max-w-2xl text-xl leading-relaxed text-muted-foreground">{t.description}</p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg" className="gap-2">
            <Link href={signupHref}>
              {t.primaryCta} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="https://github.com/mneves75/nextjs-bootstrapped-shipped">
              <Github className="h-4 w-4" /> {t.secondaryCta}
            </Link>
          </Button>
        </div>

        <BrowserMockup />
      </div>
    </section>
  );
}
