import { describe, expect, it } from 'vitest';
import { assertSchemaParity } from '@/db/schema-parity';

describe('db/schema-parity', () => {
  it('keeps postgres and sqlite schemas in sync (columns + table names)', () => {
    expect(() => assertSchemaParity()).not.toThrow();
  });
});
