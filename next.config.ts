import type { NextConfig } from 'next';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow parallel dev servers (e.g. Playwright) without fighting for .next/dev/lock.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  serverExternalPackages: ['better-sqlite3'],
  // Avoid Turbopack picking an incorrect monorepo root when multiple lockfiles exist.
  turbopack: {
    root: repoRoot,
  },
};

export default nextConfig;
