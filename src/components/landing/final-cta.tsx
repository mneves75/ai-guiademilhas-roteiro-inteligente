import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';

export async function FinalCTA() {
  const locale = await getRequestLocale();
  const t = m(locale).landing.finalCta;

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-primary/5 px-8 py-16 text-center">
          {/* Glass overlay */}
          <div className="glass-card pointer-events-none absolute inset-0 rounded-2xl" />
          {/* Decorative radial glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 bg-primary/5 blur-[80px]" />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{t.title}</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{t.subtitle}</p>
            <div className="mt-8">
              <Button asChild size="lg" className="gap-2">
                <Link href="/signup">
                  {t.button} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
