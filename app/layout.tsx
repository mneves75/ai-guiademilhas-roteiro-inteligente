import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/theme-provider';
import { PostHogAnalyticsProvider } from '@/components/posthog-provider';
import { ExperimentsProvider } from '@/components/experiments/growthbook-provider';
import { getRequestLocale } from '@/lib/locale-server';
import './globals.css';

const APP_NAME = 'NextJS Bootstrapped Shipped';
const APP_DESCRIPTION =
  'Open-source Next.js 16 boilerplate for shipping production-ready apps fast. Authentication, payments, multi-tenancy, and more included.';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://shipped.dev';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    'Next.js',
    'React',
    'TypeScript',
    'Boilerplate',
    'Starter Kit',
    'SaaS',
    'Authentication',
    'Stripe',
    'Drizzle ORM',
    'Tailwind CSS',
  ],
  authors: [{ name: 'Shipped Team' }],
  creator: 'Shipped Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [
      {
        url: `${APP_URL}/api/og`,
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [`${APP_URL}/api/og`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale();
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogAnalyticsProvider>
            <ExperimentsProvider>{children}</ExperimentsProvider>
          </PostHogAnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
