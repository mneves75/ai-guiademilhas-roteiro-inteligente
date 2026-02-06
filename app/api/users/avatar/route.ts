import { NextResponse, type NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getStorage } from '@/lib/storage';
import crypto from 'node:crypto';

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function POST(request: NextRequest) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 });
  }

  const ext = EXT_BY_MIME[file.type] ?? 'bin';
  const key = `avatars/${session.user.id}/${crypto.randomUUID()}.${ext}`;
  const storage = getStorage();
  const body = Buffer.from(await file.arrayBuffer());
  const storedKey = await storage.upload(key, body);
  const url = storage.getUrl(storedKey);

  return NextResponse.json({ url }, { status: 201 });
}
