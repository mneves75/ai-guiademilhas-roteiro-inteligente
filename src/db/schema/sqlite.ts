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

// ==================== AUTH TABLES ====================

export const users = sqliteTable(
  'users',
  {
    id: text().primaryKey(),
    name: text(),
    email: text().notNull().unique(),
    emailVerified: integer({ mode: 'boolean' }).notNull().default(false),
    image: text(),
    // Admin plugin fields (role, banned status)
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
    // Admin impersonation field (tracks impersonator user id)
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

export const sharedReports = sqliteTable(
  'shared_reports',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    token: text().notNull().unique(),
    creatorUserId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    locale: text().notNull().default('pt-BR'),
    reportJson: text().notNull(),
    ...timestamps,
  },
  (table) => [
    index('idx_shared_reports_token').on(table.token),
    index('idx_shared_reports_creator').on(table.creatorUserId),
    index('idx_shared_reports_deleted').on(table.deletedAt),
  ]
);

/**
 * PLANS TABLE
 * Planos de viagem persistentes gerados pelo planner.
 */
export const plans = sqliteTable(
  'plans',
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: integer().references(() => workspaces.id),
    locale: text().notNull(),
    title: text().notNull(),
    preferences: text().notNull(),
    report: text().notNull(),
    mode: text().notNull(),
    version: integer().notNull().default(1),
    parentId: text(),
    ...timestamps,
  },
  (table) => [
    index('idx_plans_user_id').on(table.userId),
    index('idx_plans_workspace_id').on(table.workspaceId),
    index('idx_plans_parent_id').on(table.parentId),
    index('idx_plans_deleted').on(table.deletedAt),
  ]
);

/**
 * PLAN_CACHE TABLE
 * LLM response cache — SHA256 hash of preferences → cached report.
 * TTL enforced at query time (7 days). Rows can be cleaned up periodically.
 */
export const planCache = sqliteTable(
  'plan_cache',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    hash: text().notNull().unique(), // SHA256 hex = 64 chars
    report: text().notNull(), // JSON stringified PlannerReport
    model: text().notNull(), // e.g. "gemini-2.5-flash"
    hitCount: integer().notNull().default(0),
    createdAt: integer({ mode: 'timestamp' })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex('idx_plan_cache_hash').on(table.hash)]
);

// ==================== RELATIONS ====================
// Identical structure to postgres.ts — relations() is dialect-agnostic

export const userRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  workspaceMemberships: many(workspaceMembers),
  accounts: many(accounts),
  sessions: many(sessions),
  sharedReports: many(sharedReports),
  plans: many(plans),
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

export const sharedReportRelations = relations(sharedReports, ({ one }) => ({
  creator: one(users, {
    fields: [sharedReports.creatorUserId],
    references: [users.id],
  }),
}));

export const planRelations = relations(plans, ({ one }) => ({
  user: one(users, {
    fields: [plans.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [plans.workspaceId],
    references: [workspaces.id],
  }),
  parent: one(plans, {
    fields: [plans.parentId],
    references: [plans.id],
    relationName: 'planVersions',
  }),
}));
