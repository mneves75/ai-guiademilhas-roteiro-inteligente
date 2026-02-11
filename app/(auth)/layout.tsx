import type { Metadata } from 'next';
import Link from 'next/link';
import { Rocket } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: {
    template: '%s | NextJS Bootstrapped Shipped',
    default: 'Authentication',
  },
  robots: { index: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="hero-glow flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground"
      >
        <Rocket className="h-6 w-6" />
        Shipped
      </Link>
      <Card className="glass-card-elevated reveal-visible w-full max-w-md p-8">{children}</Card>
    </div>
  );
}
