import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/theme-provider';
import { PostHogAnalyticsProvider } from '@/components/posthog-provider';
import { ExperimentsProvider } from '@/components/experiments/growthbook-provider';
import { getRequestLocale } from '@/lib/locale-server';
import { LocaleProvider } from '@/contexts/locale-context';
import { resolvePublicOrigin } from '@/lib/seo/base-url';
import './globals.css';

const APP_NAME = 'Guia de Milhas';
const APP_DESCRIPTION =
  'Planner inteligente para viagens com milhas: compare cenarios, reduza custos e decida com clareza.';
const APP_URL = resolvePublicOrigin();
const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION?.trim();
const BING_SITE_VERIFICATION = process.env.BING_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  verification: {
    ...(GOOGLE_SITE_VERIFICATION ? { google: GOOGLE_SITE_VERIFICATION } : {}),
    ...(BING_SITE_VERIFICATION
      ? {
          other: {
            // Bing Webmaster Tools
            'msvalidate.01': BING_SITE_VERIFICATION,
          },
        }
      : {}),
  },
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    'milhas',
    'passagens',
    'planejamento de viagem',
    'guia de milhas',
    'estrategia de emissao',
    'viagem internacional',
    'viagem nacional',
    'planner com IA',
  ],
  authors: [{ name: 'Guia de Milhas' }],
  creator: 'Guia de Milhas',
  openGraph: {
    type: 'website',
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
        <LocaleProvider locale={locale}>
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
        </LocaleProvider>
      </body>
    </html>
  );
}
