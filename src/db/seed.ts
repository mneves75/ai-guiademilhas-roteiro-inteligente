import { DB_PROVIDER } from './client';

/**
 * Multi-database seed script.
 * Resolves the correct driver based on DB_PROVIDER env var.
 */
async function runSeed() {
  console.log(`Seeding database (provider: ${DB_PROVIDER})...`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let schema: any;
  let cleanup: () => Promise<void> = async () => {};

  if (DB_PROVIDER === 'sqlite') {
    const Database = (await import('better-sqlite3')).default;
    const { drizzle } = await import('drizzle-orm/better-sqlite3');
    const sqliteSchema = await import('./schema/sqlite');

    const dbPath = process.env.SQLITE_PATH ?? './data/app.db';
    const { mkdirSync, existsSync } = await import('fs');
    const { dirname } = await import('path');
    const dir = dirname(dbPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');

    db = drizzle(sqlite, { schema: sqliteSchema });
    schema = sqliteSchema;
    cleanup = async () => {
      sqlite.close();
    };
  } else {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error('DATABASE_URL not set');
      process.exit(1);
    }

    const pg = (await import('postgres')).default;
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const pgSchema = await import('./schema/postgres');

    const client = pg(connectionString);
    db = drizzle(client, { schema: pgSchema });
    schema = pgSchema;
    cleanup = async () => client.end();
  }

  try {
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

    const sampleUsers = userIds.map((id, i) => ({
      id,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(schema.users).values(sampleUsers).onConflictDoNothing();
    console.log('  + 10 users');

    const workspaceData = [
      { name: 'Acme Corp', slug: 'acme-corp', ownerUserId: 'user_01' },
      { name: 'TechStart Inc', slug: 'techstart-inc', ownerUserId: 'user_02' },
      { name: 'DevShop', slug: 'devshop', ownerUserId: 'user_03' },
      { name: 'StartupXYZ', slug: 'startupxyz', ownerUserId: 'user_04' },
      { name: 'CloudNine', slug: 'cloudnine', ownerUserId: 'user_05' },
    ];

    const insertedWorkspaces = await db
      .insert(schema.workspaces)
      .values(
        workspaceData.map((w) => ({
          ...w,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      )
      .onConflictDoNothing()
      .returning();
    console.log('  + 5 workspaces');

    if (insertedWorkspaces.length > 0) {
      const memberData: {
        workspaceId: number;
        userId: string;
        role: string;
        createdAt: Date;
        updatedAt: Date;
      }[] = [];

      for (const ws of insertedWorkspaces) {
        memberData.push({
          workspaceId: ws.id,
          userId: ws.ownerUserId,
          role: 'owner',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        const memberIndex = (ws.id % 5) + 5;
        memberData.push({
          workspaceId: ws.id,
          userId: userIds[memberIndex] ?? 'user_06',
          role: 'member',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        memberData.push({
          workspaceId: ws.id,
          userId: userIds[(memberIndex + 1) % 10] ?? 'user_07',
          role: 'viewer',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await db.insert(schema.workspaceMembers).values(memberData).onConflictDoNothing();
      console.log('  + 15 workspace members');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscriptionData = insertedWorkspaces.map((ws: any, i: number) => ({
        workspaceId: ws.id,
        stripeCustomerId: `cus_sample_${ws.id}`,
        stripeSubscriptionId: `sub_sample_${ws.id}`,
        stripePriceId: i % 3 === 0 ? 'price_basic' : i % 3 === 1 ? 'price_pro' : 'price_enterprise',
        status: i % 4 === 0 ? 'canceled' : 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await db.insert(schema.subscriptions).values(subscriptionData).onConflictDoNothing();
      console.log('  + 5 subscriptions');
    }

    console.log('\nDatabase seeded successfully');
    await cleanup();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    await cleanup();
    process.exit(1);
  }
}

runSeed();
