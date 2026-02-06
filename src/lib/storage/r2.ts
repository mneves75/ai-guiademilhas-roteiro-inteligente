import type { StorageAdapter } from './index';

/**
 * Cloudflare R2 storage adapter (S3-compatible API).
 *
 * Requires: @aws-sdk/client-s3 installed + env vars:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 */
export class R2Storage implements StorageAdapter {
  private bucketName: string;
  private accountId: string;

  constructor() {
    this.bucketName = process.env.R2_BUCKET_NAME ?? '';
    this.accountId = process.env.R2_ACCOUNT_ID ?? '';

    if (!this.bucketName || !this.accountId) {
      throw new Error('R2_BUCKET_NAME and R2_ACCOUNT_ID are required for R2 storage');
    }
  }

  async upload(key: string, data: Buffer | ReadableStream): Promise<string> {
    const body = await toBuffer(data);
    const { S3Client, PutObjectCommand } = await loadS3();
    const client = this.createClient(S3Client);

    await client.send(new PutObjectCommand({ Bucket: this.bucketName, Key: key, Body: body }));
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const { S3Client, GetObjectCommand } = await loadS3();
    const client = this.createClient(S3Client);

    const response = await client.send(new GetObjectCommand({ Bucket: this.bucketName, Key: key }));

    const stream = response.Body;
    if (!stream) throw new Error(`File not found: ${key}`);

    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    const { S3Client, DeleteObjectCommand } = await loadS3();
    const client = this.createClient(S3Client);

    await client.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }));
  }

  getUrl(key: string): string {
    const publicDomain = process.env.R2_PUBLIC_DOMAIN;
    if (publicDomain) {
      return `https://${publicDomain}/${key}`;
    }
    return `https://${this.bucketName}.${this.accountId}.r2.cloudflarestorage.com/${key}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createClient(S3Client: any) {
    return new S3Client({
      region: 'auto',
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      },
    });
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
 * Dynamic import of @aws-sdk/client-s3
 * Only loaded when R2 storage is actually used.
 * Install: bun add @aws-sdk/client-s3
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadS3(): Promise<any> {
  try {
    return await import('@aws-sdk/client-s3');
  } catch {
    throw new Error(
      'R2 storage requires @aws-sdk/client-s3. Install it: bun add @aws-sdk/client-s3'
    );
  }
}
