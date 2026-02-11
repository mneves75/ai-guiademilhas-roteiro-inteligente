type RequestLike = {
  headers: Headers;
};

let fallbackSequence = 0;

function createLegacyFallbackRequestId(): string {
  fallbackSequence = (fallbackSequence + 1) >>> 0;
  const nowHex = Date.now().toString(16);
  const perfNowHex =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? Math.floor(performance.now() * 1000).toString(16)
      : '0';
  const seqHex = fallbackSequence.toString(16).padStart(8, '0');
  return `${nowHex}${perfNowHex}${seqHex}`;
}

export function getOrCreateRequestId(request: RequestLike): string {
  const existing = request.headers.get('x-request-id')?.trim();
  if (existing && /^[a-zA-Z0-9._:-]{8,200}$/.test(existing)) return existing;

  // Prefer Web Crypto UUID when available (Edge + modern Node).
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;

  // Fallback: 16 crypto bytes as hex when available.
  const getRandomValues = globalThis.crypto?.getRandomValues?.bind(globalThis.crypto);
  if (getRandomValues) {
    const bytes = new Uint8Array(16);
    getRandomValues(bytes);
    let out = '';
    for (const b of bytes) out += b.toString(16).padStart(2, '0');
    return out;
  }

  // Last-resort deterministic ID for non-crypto runtimes (observability only).
  return createLegacyFallbackRequestId();
}
