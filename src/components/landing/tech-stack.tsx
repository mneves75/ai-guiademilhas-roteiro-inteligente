export function TechStack() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Tech stack</h2>
        <ul className="mt-6 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <li>
            <span className="font-medium text-foreground">Next.js 16</span> App Router, RSC-first
          </li>
          <li>
            <span className="font-medium text-foreground">React 19</span> with modern patterns
          </li>
          <li>
            <span className="font-medium text-foreground">Drizzle ORM</span> Postgres, SQLite, D1
          </li>
          <li>
            <span className="font-medium text-foreground">Tailwind CSS v4</span> design tokens via
            CSS variables
          </li>
          <li>
            <span className="font-medium text-foreground">Vitest</span> unit tests
          </li>
          <li>
            <span className="font-medium text-foreground">Playwright</span> end-to-end tests
          </li>
        </ul>
      </div>
    </section>
  );
}
