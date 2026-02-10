'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/locale-context';
import { m } from '@/lib/messages';

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const { locale } = useLocale();
  const t = m(locale).landing.pricing;

  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{t.title}</h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">{t.subtitle}</p>
        </div>

        {/* Monthly/Yearly toggle */}
        <div className="mx-auto mb-10 flex max-w-xs justify-center gap-1 rounded-full border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setIsYearly(false)}
            className={cn(
              'rounded-full px-5 py-1.5 text-sm font-medium transition-all',
              !isYearly
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.monthly}
          </button>
          <button
            type="button"
            onClick={() => setIsYearly(true)}
            className={cn(
              'rounded-full px-5 py-1.5 text-sm font-medium transition-all',
              isYearly
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.yearly}
          </button>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:gap-6 lg:grid-cols-3">
          {t.plans.map((plan) => {
            const isFeatured = plan.id === 'pro';
            return (
              <div
                key={plan.id}
                className={cn(
                  'flex flex-col rounded-2xl p-6',
                  isFeatured ? 'glass-card-featured' : 'glass-card'
                )}
              >
                <div className="mb-4 flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  {isFeatured && (
                    <span className="glass-card rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {t.popular}
                      <span className="sr-only">{t.popularSr}</span>
                    </span>
                  )}
                </div>
                <div className="mb-1 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <p className="mb-6 text-sm text-muted-foreground">{plan.description}</p>
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={isFeatured ? 'default' : 'outline'} asChild>
                  <Link href="/signup">{plan.cta}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
