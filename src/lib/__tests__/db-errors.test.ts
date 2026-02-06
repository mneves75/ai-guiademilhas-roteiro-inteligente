import { describe, expect, it } from 'vitest';
import { isUniqueConstraintError } from '@/db/errors';

describe('db/errors', () => {
  it('returns false for non-Error values', () => {
    expect(isUniqueConstraintError(null)).toBe(false);
    expect(isUniqueConstraintError({})).toBe(false);
  });

  it('detects postgres unique violations by code', () => {
    const err = new Error('duplicate key value violates unique constraint');
    (err as unknown as { code: string }).code = '23505';
    expect(isUniqueConstraintError(err)).toBe(true);
  });

  it('detects sqlite unique violations by code', () => {
    const err = new Error('UNIQUE constraint failed: users.email');
    (err as unknown as { code: string }).code = 'SQLITE_CONSTRAINT_UNIQUE';
    expect(isUniqueConstraintError(err)).toBe(true);
  });

  it('detects unique violations by message', () => {
    expect(isUniqueConstraintError(new Error('UNIQUE constraint failed: x.y'))).toBe(true);
    expect(
      isUniqueConstraintError(new Error('duplicate key value violates unique constraint'))
    ).toBe(true);
    expect(isUniqueConstraintError(new Error('some other failure'))).toBe(false);
  });
});
