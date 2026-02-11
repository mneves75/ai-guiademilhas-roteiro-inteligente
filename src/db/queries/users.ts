import { db, users } from '@/db/client';
import { eq } from 'drizzle-orm';

/**
 * Get user by ID
 * Note: Better Auth tables don't use soft deletes
 */
export async function getUserById(id: string) {
  return db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, id),
    with: {
      workspaceMemberships: true,
    },
  });
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email.toLowerCase()),
  });
}

/**
 * Get all users
 */
export async function getActiveUsers() {
  return db.query.users.findMany({});
}

/**
 * Get users with pagination
 */
export async function getActiveUsersPaginated(limit: number = 50, offset: number = 0) {
  return db.query.users.findMany({
    limit,
    offset,
  });
}

/**
 * Update user (name, image)
 */
export async function updateUser(id: string, data: { name?: string; image?: string }) {
  await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));

  return db.select().from(users).where(eq(users.id, id)).limit(1);
}
