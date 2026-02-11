import { Shield, Users, CreditCard, Mail, BarChart3, Zap } from 'lucide-react';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';

const FEATURE_ICONS = [Shield, Users, CreditCard, Mail, BarChart3, Zap] as const;

const BENTO_CLASSES = [
  'md:col-span-2', // Authentication — wide
  'md:col-span-1', // Multi-Tenancy
  'md:col-span-1', // Stripe Payments
  'md:col-span-1', // Email System
  'md:col-span-1', // Admin Dashboard
  'md:col-span-3', // Performance — full width
] as const;

export async function Features() {
  const locale = await getRequestLocale();
  const t = m(locale).landing.features;

  return (
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{t.title}</h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">{t.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {t.items.map((feature, i) => {
            const Icon = FEATURE_ICONS[i] ?? Zap;
            const isWide = i === 0 || i === 5;
            return (
              <div
                key={feature.title}
                className={`glass-card rounded-2xl p-6 ${BENTO_CLASSES[i] ?? ''}`}
              >
                <div className="inline-flex rounded-xl bg-primary/10 p-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p
                  className={`mt-2 text-sm text-muted-foreground sm:text-base ${isWide ? 'max-w-lg' : ''}`}
                >
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
