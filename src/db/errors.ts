export function isUniqueConstraintError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;

  const code = (err as { code?: unknown }).code;
  if (code === '23505' || code === 'SQLITE_CONSTRAINT_UNIQUE') return true;

  // Postgres.js and SQLite drivers differ; fall back to message heuristics.
  return /unique|UNIQUE constraint failed/i.test(err.message);
}
