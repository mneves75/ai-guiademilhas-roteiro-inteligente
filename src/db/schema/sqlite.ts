import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

/**
 * SQLite schema — mirrors postgres.ts structure exactly.
 * Column type mapping:
 *   PG varchar → text
 *   PG timestamp → integer({ mode: 'timestamp' })
 *   PG boolean → integer({ mode: 'boolean' })
 *   PG serial → integer({ autoIncrement: true })
 */

const timestamps = {
  createdAt: integer({ mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer({ mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  deletedAt: integer({ mode: 'timestamp' }),
};

// ==================== BETTER AUTH TABLES ====================

export const users = sqliteTable(
  'users',
  {
    id: text().primaryKey(),
    name: text(),
    email: text().notNull().unique(),
    emailVerified: integer({ mode: 'boolean' }).notNull().default(false),
    image: text(),
    // Better Auth admin plugin fields
    role: text(),
    banned: integer({ mode: 'boolean' }).notNull().default(false),
    banReason: text(),
    banExpires: integer({ mode: 'timestamp' }),
    createdAt: integer({ mode: 'timestamp' }).notNull(),
    updatedAt: integer({ mode: 'timestamp' }).notNull(),
  },
  (table) => [index('idx_users_email').on(table.email)]
);

export const sessions = sqliteTable(
  'sessions',
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text().notNull().unique(),
    expiresAt: integer({ mode: 'timestamp' }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    // Better Auth admin plugin field (tracks impersonator user id)
    impersonatedBy: text(),
    createdAt: integer({ mode: 'timestamp' }).notNull(),
    updatedAt: integer({ mode: 'timestamp' }).notNull(),
  },
  (table) => [
    index('idx_sessions_user_id').on(table.userId),
    index('idx_sessions_token').on(table.token),
  ]
);

export const accounts = sqliteTable(
  'accounts',
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: text().notNull(),
    providerId: text().notNull(),
    accessToken: text(),
    refreshToken: text(),
    accessTokenExpiresAt: integer({ mode: 'timestamp' }),
    refreshTokenExpiresAt: integer({ mode: 'timestamp' }),
    scope: text(),
    idToken: text(),
    password: text(),
    createdAt: integer({ mode: 'timestamp' }).notNull(),
    updatedAt: integer({ mode: 'timestamp' }).notNull(),
  },
  (table) => [
    index('idx_accounts_user_id').on(table.userId),
    uniqueIndex('idx_accounts_provider').on(table.accountId, table.providerId),
  ]
);

export const verification = sqliteTable(
  'verification',
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: integer({ mode: 'timestamp' }).notNull(),
    createdAt: integer({ mode: 'timestamp' }),
    updatedAt: integer({ mode: 'timestamp' }),
  },
  (table) => [index('idx_verification_identifier').on(table.identifier)]
);

// ==================== CUSTOM APP TABLES ====================

export const workspaces = sqliteTable(
  'workspaces',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    slug: text().notNull().unique(),
    ownerUserId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    index('idx_workspaces_owner').on(table.ownerUserId),
    index('idx_workspaces_deleted').on(table.deletedAt),
  ]
);

export const workspaceMembers = sqliteTable(
  'workspace_members',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    workspaceId: integer()
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text().notNull().default('member'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_workspace_members_unique').on(table.workspaceId, table.userId),
    index('idx_workspace_members_user').on(table.userId),
    index('idx_workspace_members_deleted').on(table.deletedAt),
  ]
);

export const workspaceInvitations = sqliteTable(
  'workspace_invitations',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    workspaceId: integer()
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    email: text().notNull(),
    role: text().notNull().default('member'),
    token: text().notNull().unique(),
    invitedByUserId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer({ mode: 'timestamp' }).notNull(),
    acceptedAt: integer({ mode: 'timestamp' }),
    ...timestamps,
  },
  (table) => [
    index('idx_invitations_workspace').on(table.workspaceId),
    index('idx_invitations_email').on(table.email),
    index('idx_invitations_token').on(table.token),
    index('idx_invitations_deleted').on(table.deletedAt),
  ]
);

export const subscriptions = sqliteTable(
  'subscriptions',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    workspaceId: integer()
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    stripeCustomerId: text().unique(),
    stripeSubscriptionId: text().unique(),
    stripePriceId: text(),
    status: text().notNull().default('incomplete'),
    currentPeriodStart: integer({ mode: 'timestamp' }),
    currentPeriodEnd: integer({ mode: 'timestamp' }),
    cancelAtPeriodEnd: integer({ mode: 'boolean' }).default(false),
    ...timestamps,
  },
  (table) => [
    index('idx_subscriptions_workspace').on(table.workspaceId),
    index('idx_subscriptions_stripe_customer').on(table.stripeCustomerId),
    index('idx_subscriptions_stripe_subscription').on(table.stripeSubscriptionId),
    index('idx_subscriptions_deleted').on(table.deletedAt),
  ]
);

export const stripeEvents = sqliteTable(
  'stripe_events',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    stripeEventId: text().notNull().unique(),
    type: text().notNull(),
    status: text().notNull().default('received'),
    receivedAt: integer({ mode: 'timestamp' })
      .$defaultFn(() => new Date())
      .notNull(),
    processedAt: integer({ mode: 'timestamp' }),
    error: text(),
  },
  (table) => [index('idx_stripe_events_event_id').on(table.stripeEventId)]
);

// ==================== RELATIONS ====================
// Identical structure to postgres.ts — relations() is dialect-agnostic

export const userRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  workspaceMemberships: many(workspaceMembers),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const workspaceRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerUserId],
    references: [users.id],
  }),
  members: many(workspaceMembers),
  subscriptions: many(subscriptions),
  invitations: many(workspaceInvitations),
}));

export const workspaceMemberRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
}));

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [subscriptions.workspaceId],
    references: [workspaces.id],
  }),
}));

export const workspaceInvitationRelations = relations(workspaceInvitations, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceInvitations.workspaceId],
    references: [workspaces.id],
  }),
  invitedBy: one(users, {
    fields: [workspaceInvitations.invitedByUserId],
    references: [users.id],
  }),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));
