import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | NextJS Bootstrapped Shipped',
    default: 'Authentication',
  },
  robots: { index: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
