import { and, isNull, SQL, Column } from 'drizzle-orm';

/**
 * Soft Delete Filter
 * Helper to create WHERE clause: deleted_at IS NULL
 */
export function withSoftDeleteFilter(table: { deletedAt: Column }): SQL {
  return isNull(table.deletedAt);
}

/**
 * Set deleted_at to current timestamp (soft delete)
 */
export function softDeleteNow(): { deletedAt: Date } {
  return { deletedAt: new Date() };
}

/**
 * Clear deleted_at to restore (reactivate)
 */
export function restoreNow(): { deletedAt: null } {
  return { deletedAt: null };
}

/**
 * Multi-condition builder for queries with multiple filters
 */
export function buildConditions(...conditions: (SQL | undefined)[]): SQL | undefined {
  const filtered = conditions.filter((c): c is SQL => c !== undefined);
  if (filtered.length === 0) return undefined;
  if (filtered.length === 1) return filtered[0];
  return and(...filtered);
}
