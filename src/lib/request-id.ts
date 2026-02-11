type RequestLike = {
  headers: Headers;
};

export function getOrCreateRequestId(request: RequestLike): string {
  const existing = request.headers.get('x-request-id')?.trim();
  if (existing && /^[a-zA-Z0-9._:-]{8,200}$/.test(existing)) return existing;

  // Prefer Web Crypto UUID when available (Edge + modern Node).
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;

  // Fallback: 16 random bytes as hex.
  const bytes = new Uint8Array(16);
  const getRandomValues = globalThis.crypto?.getRandomValues?.bind(globalThis.crypto);
  if (getRandomValues) {
    getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }

  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}
