import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type RevealOnScrollProps = {
  children: ReactNode;
  className?: string;
};

// Intentionally a no-op wrapper. If you want actual reveal animations, implement a
// client component + IntersectionObserver and corresponding CSS utilities.
export function RevealOnScroll({ children, className }: RevealOnScrollProps) {
  return <div className={cn(className)}>{children}</div>;
}
