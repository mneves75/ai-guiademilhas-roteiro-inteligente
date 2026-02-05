import type { StorageAdapter } from './index';

/**
 * Vercel Blob storage adapter.
 *
 * Requires: @vercel/blob installed + BLOB_READ_WRITE_TOKEN env var
 * (auto-set by Vercel when Blob store is connected)
 *
 * Install: bun add @vercel/blob
 */
export class VercelBlobStorage implements StorageAdapter {
  async upload(key: string, data: Buffer | ReadableStream): Promise<string> {
    const { put } = await loadVercelBlob();
    const body = await toBuffer(data);
    const blob = await put(key, body, { access: 'public' });
    return blob.url;
  }

  async download(key: string): Promise<Buffer> {
    const response = await fetch(key);
    if (!response.ok) throw new Error(`Failed to download: ${key}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async delete(key: string): Promise<void> {
    const { del } = await loadVercelBlob();
    await del(key);
  }

  getUrl(key: string): string {
    // Vercel Blob URLs are already public URLs returned from upload
    return key;
  }
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

/**
 * Dynamic import of @vercel/blob
 * Only loaded when Vercel Blob storage is actually used.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadVercelBlob(): Promise<any> {
  try {
    // @ts-expect-error — optional dependency, install: bun add @vercel/blob
    return await import('@vercel/blob');
  } catch {
    throw new Error('Vercel Blob storage requires @vercel/blob. Install it: bun add @vercel/blob');
  }
}
