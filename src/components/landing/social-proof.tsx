import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';

export async function SocialProof() {
  const locale = await getRequestLocale();
  const t = m(locale).landing.socialProof;

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-8 text-center text-sm font-medium text-muted-foreground">
          {t.badges[0]} &middot; {t.badges[1]} &middot; {t.badges[2]} &middot; {t.badges[3]}
        </p>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
          {t.metrics.map((metric) => (
            <div key={metric.label} className="text-center">
              <p className="text-2xl font-bold tracking-tight sm:text-3xl">{metric.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 h-px max-w-md bg-border/60" />
      </div>
    </section>
  );
}
