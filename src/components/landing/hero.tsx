import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="border-b">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
        <div className="flex flex-col justify-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Ship a production app fast.
          </h1>
          <p className="mt-4 max-w-prose text-pretty text-muted-foreground">
            Next.js 16 starter with auth, Stripe, Drizzle, email, MDX blog, and tests wired to pass.
            Designed for shipping, not demos.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/blog">Read the blog</Link>
            </Button>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <div className="text-sm font-medium">What you get</div>
          <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
            <li>Authentication and sessions</li>
            <li>Stripe payments and webhooks</li>
            <li>Drizzle ORM: Postgres, SQLite, D1</li>
            <li>MDX blog with code highlighting</li>
            <li>Unit tests (Vitest) and E2E tests (Playwright)</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
