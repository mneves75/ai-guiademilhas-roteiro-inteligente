import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/postgres';

/**
 * Seed development database with sample data
 */
async function runSeed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  console.log('Seeding database...');

  try {
    // Create sample users
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

    // Create sample workspaces
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

    // Create workspace members
    if (insertedWorkspaces.length > 0) {
      const memberData: {
        workspaceId: number;
        userId: string;
        role: string;
        createdAt: Date;
        updatedAt: Date;
      }[] = [];

      for (const ws of insertedWorkspaces) {
        // Owner is always a member with 'owner' role
        memberData.push({
          workspaceId: ws.id,
          userId: ws.ownerUserId,
          role: 'owner',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        // Add 2 members to each workspace
        const memberIndex = (ws.id % 5) + 5; // Users 6-10
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

      // Create subscriptions
      const subscriptionData = insertedWorkspaces.map((ws, i) => ({
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
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    await client.end();
    process.exit(1);
  }
}

runSeed();
