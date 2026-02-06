import Link from 'next/link';
import { ArrowRight, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="hero-glow py-24 md:py-32">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center sm:px-6">
        <div className="glass-card flex items-center gap-2 rounded-full px-4 py-1.5 text-sm">
          <span className="text-muted-foreground">Open Source</span>
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            v1.0
          </span>
        </div>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          Ship your SaaS in{' '}
          <span className="bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground bg-clip-text text-transparent">
            days, not months
          </span>
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          The open-source Next.js 16 boilerplate with authentication, payments, teams, and
          everything you need to launch your product faster.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Start Building <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="https://github.com/mneves75/nextjs-bootstrapped-shipped">
            <Button variant="outline" size="lg" className="gap-2">
              <Github className="h-4 w-4" /> View on GitHub
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
