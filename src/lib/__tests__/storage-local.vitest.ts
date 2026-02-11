import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { LocalStorage } from '@/lib/storage/local';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('LocalStorage key validation', () => {
  let dir: string;
  let previousPath: string | undefined;

  beforeEach(() => {
    previousPath = process.env.STORAGE_LOCAL_PATH;
    dir = mkdtempSync(join(tmpdir(), 'local-storage-'));
    process.env.STORAGE_LOCAL_PATH = dir;
  });

  afterEach(() => {
    if (previousPath === undefined) {
      delete process.env.STORAGE_LOCAL_PATH;
    } else {
      process.env.STORAGE_LOCAL_PATH = previousPath;
    }
    rmSync(dir, { recursive: true, force: true });
  });

  it('rejects absolute paths', async () => {
    const storage = new LocalStorage();
    await expect(storage.upload('/etc/passwd', Buffer.from('x'))).rejects.toThrow('Invalid key');
  });

  it('rejects traversal paths', async () => {
    const storage = new LocalStorage();
    await expect(storage.upload('../x', Buffer.from('x'))).rejects.toThrow('Invalid key');
    await expect(storage.upload('a/../b', Buffer.from('x'))).rejects.toThrow('Invalid key');
  });

  it('rejects backslashes and control chars', async () => {
    const storage = new LocalStorage();
    await expect(storage.upload('a\\\\b', Buffer.from('x'))).rejects.toThrow('Invalid key');
    await expect(storage.upload('a\u0000b', Buffer.from('x'))).rejects.toThrow('Invalid key');
  });

  it('allows a normal key', async () => {
    const storage = new LocalStorage();
    const key = 'avatars/user_123/abc.png';
    await storage.upload(key, Buffer.from('hello'));
    const buf = await storage.download(key);
    expect(buf.toString('utf8')).toBe('hello');
    expect(storage.getUrl(key)).toBe('/api/files/avatars/user_123/abc.png');
  });
});
