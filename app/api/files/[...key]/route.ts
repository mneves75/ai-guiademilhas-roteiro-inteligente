import { NextResponse, type NextRequest } from 'next/server';
import { getStorage } from '@/lib/storage';

type RouteContext = { params: Promise<{ key: string[] }> };

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

function getExt(path: string): string {
  const idx = path.lastIndexOf('.');
  if (idx === -1) return '';
  return path.slice(idx).toLowerCase();
}

function isSafeKey(key: string): boolean {
  // Prevent path traversal for the local filesystem adapter.
  return !key.split('/').some((seg) => seg === '..' || seg.includes('..') || seg.includes('\\'));
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { key: keyParts } = await context.params;
  const key = keyParts.join('/');

  if (!key || !isSafeKey(key)) {
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
        // Avatars and uploads are immutable by key (we include a UUID in file names).
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
