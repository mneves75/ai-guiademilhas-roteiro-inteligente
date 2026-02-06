import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileNav } from './mobile-nav';

export function Header() {
  return (
    <header className="glass-header sticky top-0 z-50 w-full">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-lg font-bold">Shipped</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link
            href="#features"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="#faq"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            FAQ
          </Link>
          <Link
            href="https://github.com/mneves75/nextjs-bootstrapped-shipped"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            GitHub
          </Link>
        </nav>

        <nav aria-label="Primary" className="flex items-center gap-2">
          <ThemeToggle />

          <Button asChild variant="ghost" size="icon" className="sm:hidden">
            <Link href="/login" aria-label="Sign In">
              <LogIn className="h-4 w-4" />
            </Link>
          </Button>

          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Sign In</Link>
          </Button>

          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/signup">Get Started</Link>
          </Button>

          <MobileNav />
        </nav>
      </div>
    </header>
  );
}
