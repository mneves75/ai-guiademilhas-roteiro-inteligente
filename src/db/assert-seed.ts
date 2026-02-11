import { db, DB_PROVIDER, subscriptions, users, workspaceMembers, workspaces } from './client';

type Counts = {
  users: number;
  workspaces: number;
  workspaceMembers: number;
  subscriptions: number;
};

const EXPECTED: Counts = {
  users: 10,
  workspaces: 5,
  workspaceMembers: 15,
  subscriptions: 5,
};

async function getCounts(): Promise<Counts> {
  // Drizzle returns a Promise for async drivers (postgres) and a plain value for sync drivers
  // (better-sqlite3). `await` and `Promise.all` handle both.
  const [u, w, m, s] = await Promise.all([
    db.select().from(users),
    db.select().from(workspaces),
    db.select().from(workspaceMembers),
    db.select().from(subscriptions),
  ]);

  return {
    users: u.length,
    workspaces: w.length,
    workspaceMembers: m.length,
    subscriptions: s.length,
  };
}

async function main() {
  if (DB_PROVIDER === 'd1') {
    throw new Error('Seed assertions are not supported for DB_PROVIDER=d1 in this environment.');
  }

  let actual: Counts | undefined;
  try {
    actual = await getCounts();
  } finally {
    // Ensure the process exits in CI. postgres.js keeps sockets open unless ended.
    const client = (db as unknown as { $client?: unknown }).$client as
      | { end?: () => unknown; close?: () => unknown }
      | undefined;
    if (client?.end) await client.end();
    if (client?.close) client.close();
  }

  for (const key of Object.keys(EXPECTED) as Array<keyof Counts>) {
    if (!actual || actual[key] !== EXPECTED[key]) {
      throw new Error(
        `Unexpected seed counts for provider "${DB_PROVIDER}": ` +
          JSON.stringify({ expected: EXPECTED, actual })
      );
    }
  }

  // Keep output stable and CI-friendly.
  console.info(`Seed counts OK (${DB_PROVIDER}): ${JSON.stringify(actual)}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
