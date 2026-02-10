import { NextResponse, type NextRequest } from 'next/server';
import { getStorage, STORAGE_PROVIDER } from '@/lib/storage';
import { withApiLogging } from '@/lib/logging';

type RouteContext = { params: Promise<{ key: string[] }> };

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

// Only expose a very small subset of the storage key space publicly.
const DEFAULT_PUBLIC_PREFIXES = ['avatars/', 'uploads/'];
const PUBLIC_PREFIXES = (process.env.STORAGE_PUBLIC_PREFIXES ?? '')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean)
  .map((p) => (p.endsWith('/') ? p : `${p}/`));

function isAllowedPublicKey(key: string): boolean {
  const prefixes = PUBLIC_PREFIXES.length ? PUBLIC_PREFIXES : DEFAULT_PUBLIC_PREFIXES;
  return prefixes.some((p) => key.startsWith(p));
}

function getExt(path: string): string {
  const idx = path.lastIndexOf('.');
  if (idx === -1) return '';
  return path.slice(idx).toLowerCase();
}

function isSafeKey(key: string): boolean {
  // Prevent path traversal for the local filesystem adapter.
  if (/[\u0000-\u001f\u007f]/.test(key)) return false;
  if (key.includes('\\')) return false;
  if (key.includes(':')) return false;
  if (key.includes('?') || key.includes('#')) return false;

  return !key.split('/').some((seg) => seg === '..' || seg.includes('..'));
}

export const GET = withApiLogging(
  'api.files.public_download',
  async (_request: NextRequest, context: RouteContext) => {
    // Security boundary: this route is only needed for local filesystem storage.
    // For cloud storage providers, serve files via their public URLs instead.
    if (STORAGE_PROVIDER !== 'local') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { key: keyParts } = await context.params;
    const key = keyParts.join('/');

    if (!key || !isSafeKey(key) || !isAllowedPublicKey(key)) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }

    try {
      const storage = getStorage();
      const buffer = await storage.download(key);
      const body = new Uint8Array(buffer);
      const ext = getExt(key);

      return new NextResponse(body, {
        status: 200,
        headers: {
          'Content-Type': MIME_BY_EXT[ext] ?? 'application/octet-stream',
          'X-Content-Type-Options': 'nosniff',
          // Avatars and uploads are immutable by key (we include a UUID in file names).
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }
);
