import { DB_PROVIDER } from './client';
import { inArray } from 'drizzle-orm';

/**
 * Multi-database seed script.
 * Resolves the correct driver based on DB_PROVIDER env var.
 */
type SeedWorkspace = { name: string; slug: string; ownerUserId: string };

const userIds = [
  'user_01',
  'user_02',
  'user_03',
  'user_04',
  'user_05',
  'user_06',
  'user_07',
  'user_08',
  'user_09',
  'user_10',
];

const workspaceSeeds: SeedWorkspace[] = [
  { name: 'Acme Corp', slug: 'acme-corp', ownerUserId: 'user_01' },
  { name: 'TechStart Inc', slug: 'techstart-inc', ownerUserId: 'user_02' },
  { name: 'DevShop', slug: 'devshop', ownerUserId: 'user_03' },
  { name: 'StartupXYZ', slug: 'startupxyz', ownerUserId: 'user_04' },
  { name: 'CloudNine', slug: 'cloudnine', ownerUserId: 'user_05' },
];

async function seedSqlite() {
  const Database = (await import('better-sqlite3')).default;
  const { drizzle } = await import('drizzle-orm/better-sqlite3');
  const schema = await import('./schema/sqlite');

  type Schema = typeof schema;
  type Db = import('drizzle-orm/better-sqlite3').BetterSQLite3Database<Schema>;

  const dbPath = process.env.SQLITE_PATH ?? './data/app.db';
  const { mkdirSync, existsSync } = await import('fs');
  const { dirname } = await import('path');
  const dir = dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const db: Db = drizzle(sqlite, { schema, casing: 'snake_case' });

  try {
    const now = new Date();
    const sampleUsers = userIds.map((id, i) => ({
      id,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    }));

    await db.insert(schema.users).values(sampleUsers).onConflictDoNothing();
    console.info('  + 10 users');

    await db
      .insert(schema.workspaces)
      .values(
        workspaceSeeds.map((w) => ({
          ...w,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        }))
      )
      .onConflictDoNothing();
    console.info('  + 5 workspaces');

    const workspaceRows = await db
      .select({
        id: schema.workspaces.id,
        slug: schema.workspaces.slug,
        ownerUserId: schema.workspaces.ownerUserId,
      })
      .from(schema.workspaces)
      .where(
        inArray(
          schema.workspaces.slug,
          workspaceSeeds.map((w) => w.slug)
        )
      );

    const memberData = workspaceRows.flatMap((ws) => {
      const memberIndex = (ws.id % 5) + 5;
      return [
        {
          workspaceId: ws.id,
          userId: ws.ownerUserId,
          role: 'owner',
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
        {
          workspaceId: ws.id,
          userId: userIds[memberIndex] ?? 'user_06',
          role: 'member',
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
        {
          workspaceId: ws.id,
          userId: userIds[(memberIndex + 1) % 10] ?? 'user_07',
          role: 'viewer',
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ];
    });

    await db.insert(schema.workspaceMembers).values(memberData).onConflictDoNothing();
    console.info('  + 15 workspace members');

    const subscriptionData = workspaceRows.map((ws, i) => ({
      workspaceId: ws.id,
      stripeCustomerId: `cus_sample_${ws.id}`,
      stripeSubscriptionId: `sub_sample_${ws.id}`,
      stripePriceId: i % 3 === 0 ? 'price_basic' : i % 3 === 1 ? 'price_pro' : 'price_enterprise',
      status: i % 4 === 0 ? 'canceled' : 'active',
      currentPeriodStart: now,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }));

    await db.insert(schema.subscriptions).values(subscriptionData).onConflictDoNothing();
    console.info('  + 5 subscriptions');
  } finally {
    sqlite.close();
  }
}

async function seedPostgres() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not set');
  }

  const pg = (await import('postgres')).default;
  const { drizzle } = await import('drizzle-orm/postgres-js');
  const schema = await import('./schema/postgres');

  type Schema = typeof schema;
  type Db = import('drizzle-orm/postgres-js').PostgresJsDatabase<Schema>;

  const client = pg(connectionString);
  const db: Db = drizzle(client, { schema, casing: 'snake_case' });

  try {
    const now = new Date();
    const sampleUsers = userIds.map((id, i) => ({
      id,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    }));

    await db.insert(schema.users).values(sampleUsers).onConflictDoNothing();
    console.info('  + 10 users');

    await db
      .insert(schema.workspaces)
      .values(
        workspaceSeeds.map((w) => ({
          ...w,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        }))
      )
      .onConflictDoNothing();
    console.info('  + 5 workspaces');

    const workspaceRows = await db
      .select({
        id: schema.workspaces.id,
        slug: schema.workspaces.slug,
        ownerUserId: schema.workspaces.ownerUserId,
      })
      .from(schema.workspaces)
      .where(
        inArray(
          schema.workspaces.slug,
          workspaceSeeds.map((w) => w.slug)
        )
      );

    const memberData = workspaceRows.flatMap((ws) => {
      const memberIndex = (ws.id % 5) + 5;
      return [
        {
          workspaceId: ws.id,
          userId: ws.ownerUserId,
          role: 'owner',
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
        {
          workspaceId: ws.id,
          userId: userIds[memberIndex] ?? 'user_06',
          role: 'member',
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
        {
          workspaceId: ws.id,
          userId: userIds[(memberIndex + 1) % 10] ?? 'user_07',
          role: 'viewer',
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ];
    });

    await db.insert(schema.workspaceMembers).values(memberData).onConflictDoNothing();
    console.info('  + 15 workspace members');

    const subscriptionData = workspaceRows.map((ws, i) => ({
      workspaceId: ws.id,
      stripeCustomerId: `cus_sample_${ws.id}`,
      stripeSubscriptionId: `sub_sample_${ws.id}`,
      stripePriceId: i % 3 === 0 ? 'price_basic' : i % 3 === 1 ? 'price_pro' : 'price_enterprise',
      status: i % 4 === 0 ? 'canceled' : 'active',
      currentPeriodStart: now,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }));

    await db.insert(schema.subscriptions).values(subscriptionData).onConflictDoNothing();
    console.info('  + 5 subscriptions');
  } finally {
    await client.end();
  }
}

function seedD1(): never {
  // D1 bindings are only available in a Cloudflare Worker request context.
  console.error('D1 seeding via Node.js is not supported.');
  console.error('Use Wrangler with the provided SQL seed:');
  console.error('  wrangler d1 execute app-db --local --file=src/db/seed.d1.sql');
  console.error('  wrangler d1 execute app-db --remote --file=src/db/seed.d1.sql');
  process.exit(1);
}

async function runSeed() {
  console.info(`Seeding database (provider: ${DB_PROVIDER})...`);

  switch (DB_PROVIDER) {
    case 'sqlite':
      await seedSqlite();
      return;
    case 'd1':
      seedD1();
    default:
      await seedPostgres();
  }
}

runSeed()
  .then(() => {
    console.info('\nDatabase seeded successfully');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
