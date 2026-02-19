import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';

const technologies = [
  'Next.js 16',
  'React 19',
  'TypeScript',
  'Tailwind CSS',
  'Drizzle ORM',
  'Stripe',
  'Supabase Auth',
  'Resend',
  'shadcn/ui',
];

export async function TechStack() {
  const locale = await getRequestLocale();
  const t = m(locale).landing.techStack;

  return (
    <section className="relative py-20 md:py-28">
      {/* Decorative grid dots */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{t.title}</h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {technologies.map((tech) => (
            <span
              key={tech}
              className="rounded-full border bg-muted/50 px-5 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent hover:shadow-sm"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
