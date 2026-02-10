import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FinalCTA() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Ready to ship your product?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">
            Join thousands of developers building with Shipped. Start for free, no credit card
            required.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link href="/signup">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
