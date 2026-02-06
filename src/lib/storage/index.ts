/**
 * Storage abstraction layer.
 *
 * Swap between local filesystem, Cloudflare R2, or Vercel Blob
 * by changing STORAGE_PROVIDER env var.
 */

import { LocalStorage } from './local';
import { R2Storage } from './r2';
import { VercelBlobStorage } from './vercel-blob';

export interface StorageAdapter {
  /** Upload a file, returns the storage key */
  upload(key: string, data: Buffer | ReadableStream): Promise<string>;
  /** Download a file by key */
  download(key: string): Promise<Buffer>;
  /** Delete a file by key */
  delete(key: string): Promise<void>;
  /** Get a public/signed URL for a key */
  getUrl(key: string): string;
}

export type StorageProvider = 'local' | 'r2' | 'vercel-blob';

const STORAGE_PROVIDER: StorageProvider =
  (process.env.STORAGE_PROVIDER as StorageProvider | undefined) ?? 'local';

let _storage: StorageAdapter | undefined;

export function getStorage(): StorageAdapter {
  if (_storage) return _storage;

  switch (STORAGE_PROVIDER) {
    case 'r2': {
      _storage = new R2Storage();
      break;
    }
    case 'vercel-blob': {
      _storage = new VercelBlobStorage();
      break;
    }
    default: {
      _storage = new LocalStorage();
      break;
    }
  }

  return _storage;
}
