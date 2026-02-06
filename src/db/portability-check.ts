import { eq } from 'drizzle-orm';
import { DB_PROVIDER, db, users, workspaces, workspaceMembers } from './client';

function uniqueId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function main() {
  if (DB_PROVIDER === 'd1') {
    throw new Error(
      'db:portability-check cannot run with DB_PROVIDER=d1 inside the Next.js app runtime. ' +
        'Run D1 checks in a Cloudflare Worker environment (wrangler) using createD1Db(env.DB).'
    );
  }

  const userId = uniqueId('user');
  const email = `${uniqueId('u')}@example.com`;
  const workspaceSlug = uniqueId('ws').toLowerCase();

  // These tables have no defaults for createdAt/updatedAt in both dialects.
  const now = new Date();

  let workspaceId: number | undefined;

  try {
    // 1) Basic select should work on both dialects.
    await db.select({ id: users.id }).from(users).limit(1);

    // 2) Insert user (no RETURNING to avoid dialect-specific assumptions).
    await db.insert(users).values({
      id: userId,
      name: 'Portability Check',
      email,
      emailVerified: false,
      image: null,
      role: null,
      banned: false,
      banReason: null,
      banExpires: null,
      createdAt: now,
      updatedAt: now,
    });

    // 3) Insert workspace (timestamps have defaults in both dialects).
    await db.insert(workspaces).values({
      name: 'Portability Workspace',
      slug: workspaceSlug,
      ownerUserId: userId,
    });

    const workspaceRows = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.slug, workspaceSlug))
      .limit(1);

    workspaceId = workspaceRows[0]?.id;
    if (!workspaceId) throw new Error('Failed to create workspace (missing id).');

    // 4) Insert membership using composite unique index (workspaceId, userId).
    await db.insert(workspaceMembers).values({
      workspaceId,
      userId,
      role: 'owner',
    });

    // 5) Update user and read back (portable update + select).
    await db
      .update(users)
      .set({ name: 'Portability Check Updated', updatedAt: new Date() })
      .where(eq(users.id, userId));

    const updated = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (updated.length !== 1) throw new Error('Expected to re-select updated user.');

    // 6) Relational query path: members for a workspace
    const members = await db
      .select({ id: workspaceMembers.id, role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));
    if (members.length < 1) throw new Error('Expected at least one workspace member.');

    console.log(`db:portability-check OK (provider=${DB_PROVIDER})`);
  } finally {
    // Cleanup to keep CI/local DBs from accumulating junk.
    // Order matters: child rows first.
    if (workspaceId) {
      await db.delete(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspaceId));
      await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
    }
    await db.delete(users).where(eq(users.id, userId));
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
