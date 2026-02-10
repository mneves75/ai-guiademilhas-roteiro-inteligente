import { Star } from 'lucide-react';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';

export async function Testimonials() {
  const locale = await getRequestLocale();
  const t = m(locale).landing.testimonials;

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{t.title}</h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">{t.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {t.items.map((item) => (
            <div key={item.author} className="glass-card flex flex-col rounded-2xl p-6">
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary/80 text-primary/80" />
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90 sm:text-base">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {item.author
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <p className="text-sm font-medium">{item.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.role}, {item.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
