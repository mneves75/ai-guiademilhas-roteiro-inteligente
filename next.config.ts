import type { NextConfig } from 'next';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow parallel dev servers (e.g. Playwright) without fighting for .next/dev/lock.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
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
  // Avoid Turbopack picking an incorrect monorepo root when multiple lockfiles exist.
  turbopack: {
    root: repoRoot,
  },
};

export default nextConfig;
