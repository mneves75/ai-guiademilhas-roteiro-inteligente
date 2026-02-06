const FAQ_ITEMS = [
  {
    q: 'Is this production-ready?',
    a: 'It is wired for strict lint/type-check/tests. You still need to audit product-specific logic.',
  },
  {
    q: 'Can I use Postgres or SQLite?',
    a: 'Yes. Use DB_PROVIDER=postgres | sqlite | d1 and follow DEVELOPMENT.md for env vars.',
  },
  {
    q: 'Does it work in CI?',
    a: 'Yes. Workflows are pinned to pnpm 10 to match the lockfile and use frozen installs.',
  },
] as const;

export function FAQ() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
        <dl className="mt-8 grid gap-6 md:grid-cols-2">
          {FAQ_ITEMS.map((item) => (
            <div key={item.q} className="rounded-xl border bg-card p-6 text-card-foreground shadow">
              <dt className="text-sm font-medium">{item.q}</dt>
              <dd className="mt-2 text-sm text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
