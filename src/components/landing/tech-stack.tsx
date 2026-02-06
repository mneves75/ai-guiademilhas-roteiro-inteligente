const technologies = [
  'Next.js 16',
  'React 19',
  'TypeScript',
  'Tailwind CSS',
  'Drizzle ORM',
  'Stripe',
  'Better Auth',
  'Resend',
  'shadcn/ui',
];

export function TechStack() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Built with the best
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Modern tools and frameworks you already know and love.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {technologies.map((tech) => (
            <span
              key={tech}
              className="rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
