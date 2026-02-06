import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function FinalCTA() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-xl border bg-card p-8 text-card-foreground shadow">
          <h2 className="text-2xl font-semibold tracking-tight">Ready to ship?</h2>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            Create an account, run the tests, and start building your product.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
