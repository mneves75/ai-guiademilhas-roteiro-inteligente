export function SocialProof() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
            <div className="text-sm font-medium">Sane defaults</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Strict TypeScript, zero-warning lint, and a repo layout that scales.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
            <div className="text-sm font-medium">CI-ready</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Reproducible installs and checks that run the same locally and in CI.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
            <div className="text-sm font-medium">No magic</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Fail-fast env validation and minimal abstraction around core primitives.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
