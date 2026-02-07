import { readFileSync, writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import type { StorageAdapter } from './index';

/**
 * Local filesystem storage adapter.
 * For VPS deployments where files live on disk.
 */
export class LocalStorage implements StorageAdapter {
  private basePath: string;

  constructor() {
    this.basePath = process.env.STORAGE_LOCAL_PATH ?? './data/uploads';
    if (!existsSync(this.basePath)) {
      mkdirSync(this.basePath, { recursive: true });
    }
  }

  async upload(key: string, data: Buffer | ReadableStream): Promise<string> {
    assertSafeLocalStorageKey(key);
    const filePath = join(this.basePath, key);
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const buffer = await toBuffer(data);
    writeFileSync(filePath, buffer);
    return key;
  }

  async download(key: string): Promise<Buffer> {
    assertSafeLocalStorageKey(key);
    const filePath = join(this.basePath, key);
    return readFileSync(filePath);
  }

  async delete(key: string): Promise<void> {
    assertSafeLocalStorageKey(key);
    const filePath = join(this.basePath, key);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  getUrl(key: string): string {
    assertSafeLocalStorageKey(key);
    const safePath = key
      .split('/')
      .filter(Boolean)
      .map((seg) => encodeURIComponent(seg))
      .join('/');
    return `/api/files/${safePath}`;
  }
}

function assertSafeLocalStorageKey(key: string): void {
  if (!key) throw new Error('Invalid key');
  // path.join(base, "/abs") discards base. Never allow absolute paths.
  if (key.startsWith('/')) throw new Error('Invalid key');
  if (/[\u0000-\u001f\u007f]/.test(key)) throw new Error('Invalid key');
  if (key.includes('\\')) throw new Error('Invalid key');
  if (key.includes(':')) throw new Error('Invalid key');
  if (key.includes('?') || key.includes('#')) throw new Error('Invalid key');

  const segments = key.split('/');
  if (segments.some((seg) => seg === '..' || seg.includes('..'))) throw new Error('Invalid key');
}

/** Convert Buffer | ReadableStream to Buffer */
async function toBuffer(data: Buffer | ReadableStream): Promise<Buffer> {
  if (Buffer.isBuffer(data)) return data;
  const chunks: Uint8Array[] = [];
  const reader = (data as ReadableStream<Uint8Array>).getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}
