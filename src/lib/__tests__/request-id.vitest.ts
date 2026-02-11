import { afterEach, describe, expect, it } from 'vitest';
import { getOrCreateRequestId } from '../request-id';

const originalCrypto = globalThis.crypto;

function setGlobalCrypto(value: Crypto | undefined): void {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value,
  });
}

describe('getOrCreateRequestId', () => {
  afterEach(() => {
    setGlobalCrypto(originalCrypto);
  });

  it('keeps a valid inbound x-request-id', () => {
    const request = { headers: new Headers({ 'x-request-id': 'req_ABC-12345678' }) };
    expect(getOrCreateRequestId(request)).toBe('req_ABC-12345678');
  });

  it('uses crypto.randomUUID when available', () => {
    setGlobalCrypto({
      randomUUID: () => '123e4567-e89b-12d3-a456-426614174000',
    } as unknown as Crypto);

    const request = { headers: new Headers({ 'x-request-id': '??invalid??' }) };
    expect(getOrCreateRequestId(request)).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('falls back to deterministic hex id when crypto is unavailable', () => {
    setGlobalCrypto(undefined);
    const request = { headers: new Headers() };

    const first = getOrCreateRequestId(request);
    const second = getOrCreateRequestId(request);

    expect(first).toMatch(/^[a-f0-9]+$/);
    expect(second).toMatch(/^[a-f0-9]+$/);
    expect(second).not.toBe(first);
  });
});
