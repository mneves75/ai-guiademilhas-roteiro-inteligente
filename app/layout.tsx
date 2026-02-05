import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NextJS Bootstrapped Shipped',
  description: 'Open-source Next.js 15 boilerplate for shipping apps fast',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
