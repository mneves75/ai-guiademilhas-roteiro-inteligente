import type { NextConfig } from 'next';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required for Docker/standalone deployments (see Dockerfile).
  output: 'standalone',
  // Allow parallel dev servers (e.g. Playwright) without fighting for .next/dev/lock.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  async headers() {
    const originFromEnv =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.BETTER_AUTH_BASE_URL ??
      process.env.BETTER_AUTH_URL ??
      '';
    const isHttps = originFromEnv.startsWith('https://');

    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      // HSTS only makes sense on HTTPS and should not be emitted on local HTTP dev.
      ...(process.env.NODE_ENV === 'production' && isHttps
        ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
        : []),
      // Helps isolate browsing contexts while still allowing OAuth-style popups.
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
      // Opt into agent clustering (defense-in-depth against some cross-origin side channels).
      { key: 'Origin-Agent-Cluster', value: '?1' },
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
      {
        key: 'Permissions-Policy',
        value: [
          'camera=()',
          'microphone=()',
          'geolocation=()',
          'payment=()',
          'usb=()',
          'browsing-topics=()',
        ].join(', '),
      },
      {
        // Keep CSP minimal to avoid breaking Next.js runtime.
        // This still provides clickjacking defense and blocks plugin content.
        key: 'Content-Security-Policy',
        value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
      },
    ];

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: '*.blob.vercel-storage.com' },
      // R2 default public URL: <bucket>.<account>.r2.cloudflarestorage.com
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
    ],
  },
  serverExternalPackages: ['better-sqlite3'],
  // Pin Turbopack root to repo root for deterministic builds.
  turbopack: {
    root: repoRoot,
  },
};

export default nextConfig;
