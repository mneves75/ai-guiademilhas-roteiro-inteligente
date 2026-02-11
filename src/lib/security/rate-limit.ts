type RateLimitEntry = { count: number; resetAt: number };

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export type RateLimitInput = {
  namespace: string;
  identifier: string;
  max: number;
  windowMs: number;
};

const globalForRateLimit = globalThis as unknown as { __rateLimit?: Map<string, RateLimitEntry> };
const memoryStore = globalForRateLimit.__rateLimit ?? new Map<string, RateLimitEntry>();
globalForRateLimit.__rateLimit = memoryStore;

function checkRateLimitMemory(input: RateLimitInput): RateLimitResult {
  const now = Date.now();
  const key = `${input.namespace}:${input.identifier}`;
  const existing = memoryStore.get(key);

  if (!existing || now >= existing.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + input.windowMs });
    return { ok: true };
  }

  if (existing.count >= input.max) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true };
}

function hasUpstashEnv(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const out = new Uint8Array(digest);
  let hex = '';
  for (const b of out) hex += b.toString(16).padStart(2, '0');
  return hex;
}

async function checkRateLimitUpstashFixedWindow(input: RateLimitInput): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return checkRateLimitMemory(input);

  const now = Date.now();
  const windowId = Math.floor(now / input.windowMs);
  const resetAt = (windowId + 1) * input.windowMs;
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));

  // Avoid storing raw PII (IP/user identifiers) in the rate limit store.
  const identifierHash = await sha256Hex(`v1:${input.identifier}`);
  const key = `rl:${input.namespace}:${windowId}:${identifierHash}`;

  const pipelineUrl = url.endsWith('/') ? `${url}pipeline` : `${url}/pipeline`;
  const ttlMs = input.windowMs * 2; // cleanup-only; window is encoded in the key
  const body = JSON.stringify([
    ['INCR', key],
    ['PEXPIRE', key, String(ttlMs)],
  ]);

  const res = await fetch(pipelineUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Upstash rate limit request failed: ${res.status}`);
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data) || typeof data[0] !== 'object' || data[0] === null) {
    throw new Error('Upstash rate limit response invalid');
  }

  const incrResult = (data[0] as { result?: unknown }).result;
  const count = typeof incrResult === 'number' ? incrResult : Number(incrResult);
  if (!Number.isFinite(count)) {
    throw new Error('Upstash INCR result invalid');
  }

  if (count > input.max) {
    return { ok: false, retryAfterSeconds };
  }

  return { ok: true };
}

/**
 * Rate limiting for Edge middleware.
 *
 * - If Upstash Redis REST env vars are set, uses a fixed-window distributed counter.
 * - Otherwise falls back to best-effort in-memory limiting (per edge instance).
 *
 * Failure mode: if Upstash is configured but unavailable, we fall back to memory
 * to avoid turning rate limiting into an availability risk.
 */
export async function checkRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  if (!input.identifier) return { ok: true };

  if (!hasUpstashEnv()) {
    return checkRateLimitMemory(input);
  }

  try {
    return await checkRateLimitUpstashFixedWindow(input);
  } catch {
    return checkRateLimitMemory(input);
  }
}
