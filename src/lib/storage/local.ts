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
    const filePath = join(this.basePath, key);
    return readFileSync(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.basePath, key);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  getUrl(key: string): string {
    return `/api/files/${encodeURIComponent(key)}`;
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
