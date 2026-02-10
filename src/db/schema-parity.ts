import { getTableColumns, getTableName, type Table } from 'drizzle-orm';
import * as pgSchema from './schema/postgres';
import * as sqliteSchema from './schema/sqlite';

const TABLE_EXPORTS = [
  'users',
  'sessions',
  'accounts',
  'verification',
  'workspaces',
  'workspaceMembers',
  'workspaceInvitations',
  'subscriptions',
  'stripeEvents',
] as const;

function asTable(value: unknown, exportName: string): Table {
  // Keep this check shallow to avoid relying on Drizzle internals.
  // getTableName/getTableColumns will throw if this isn't a Table.
  try {
    getTableName(value as Table);
    return value as Table;
  } catch {
    throw new Error(`Expected schema export "${exportName}" to be a Drizzle table.`);
  }
}

function keys(obj: Record<string, unknown>): string[] {
  return Object.keys(obj).sort();
}

function assertEqualList(name: string, a: string[], b: string[]) {
  const aStr = a.join(',');
  const bStr = b.join(',');
  if (aStr !== bStr) {
    const onlyA = a.filter((x) => !b.includes(x));
    const onlyB = b.filter((x) => !a.includes(x));
    throw new Error(
      [
        `Schema parity failed for ${name}.`,
        onlyA.length ? `Only in postgres: ${onlyA.join(', ')}` : undefined,
        onlyB.length ? `Only in sqlite: ${onlyB.join(', ')}` : undefined,
      ]
        .filter(Boolean)
        .join(' ')
    );
  }
}

export function assertSchemaParity() {
  for (const exportName of TABLE_EXPORTS) {
    const pgTable = asTable((pgSchema as Record<string, unknown>)[exportName], exportName);
    const sqliteTable = asTable((sqliteSchema as Record<string, unknown>)[exportName], exportName);

    const pgName = getTableName(pgTable);
    const sqliteName = getTableName(sqliteTable);
    if (pgName !== sqliteName) {
      throw new Error(
        `Schema parity failed for export "${exportName}": table name mismatch (${pgName} vs ${sqliteName}).`
      );
    }

    const pgColumns = keys(getTableColumns(pgTable) as Record<string, unknown>);
    const sqliteColumns = keys(getTableColumns(sqliteTable) as Record<string, unknown>);
    assertEqualList(`table "${pgName}"`, pgColumns, sqliteColumns);
  }
}

if (require.main === module) {
  assertSchemaParity();
  console.info('db:schema-parity OK');
}
