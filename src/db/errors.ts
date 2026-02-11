export function isUniqueConstraintError(err: unknown): boolean {
  const chain: unknown[] = [];

  let cur: unknown = err;
  for (let i = 0; i < 4; i += 1) {
    if (!cur) break;
    chain.push(cur);

    // Drizzle often wraps driver errors and attaches the driver error under `cause`.
    if (cur instanceof Error) {
      const cause = (cur as { cause?: unknown }).cause;
      if (cause) {
        cur = cause;
        continue;
      }
    }

    const maybeCause = (cur as { cause?: unknown } | null)?.cause;
    if (maybeCause) {
      cur = maybeCause;
      continue;
    }

    break;
  }

  for (const item of chain) {
    if (item instanceof Error) {
      const code = (item as { code?: unknown }).code;
      if (code === '23505' || code === 'SQLITE_CONSTRAINT_UNIQUE') return true;
      if (/unique|UNIQUE constraint failed/i.test(item.message)) return true;
      continue;
    }

    // Some libraries throw non-Error objects.
    const obj = item as { code?: unknown; message?: unknown } | null;
    if (obj && typeof obj === 'object') {
      if (obj.code === '23505' || obj.code === 'SQLITE_CONSTRAINT_UNIQUE') return true;
      if (typeof obj.message === 'string' && /unique|UNIQUE constraint failed/i.test(obj.message)) {
        return true;
      }
    }
  }

  return false;
}
