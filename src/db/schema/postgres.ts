import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  serial,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

/**
 * BASE PATTERN: Reusable timestamps object
 * Spread across all tables for consistency
 */
const timestamps = {
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
  deletedAt: timestamp(),
};

// ==================== BETTER AUTH TABLES ====================
// These match Better Auth's expected schema structure
// See: https://www.better-auth.com/docs/concepts/database

/**
 * USERS TABLE
 * Managed by Better Auth (signup, OAuth, password reset)
 */
export const users = pgTable(
  'users',
  {
    id: varchar({ length: 255 }).primaryKey(),
    name: varchar({ length: 255 }),
    email: varchar({ length: 255 }).notNull().unique(),
    emailVerified: boolean().notNull().default(false),
    image: varchar({ length: 255 }),
    // Better Auth admin plugin fields
    role: varchar({ length: 255 }),
    banned: boolean().notNull().default(false),
    banReason: text(),
    banExpires: timestamp(),
    createdAt: timestamp().notNull(),
    updatedAt: timestamp().notNull(),
  },
  (table) => [index('idx_users_email').on(table.email)]
);

/**
 * SESSIONS TABLE
 * Browser session tokens (Better Auth handles creation)
 */
export const sessions = pgTable(
  'sessions',
  {
    id: varchar({ length: 255 }).primaryKey(),
    userId: varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: varchar({ length: 255 }).notNull().unique(),
    expiresAt: timestamp().notNull(),
    ipAddress: varchar({ length: 255 }),
    userAgent: varchar({ length: 255 }),
    // Better Auth admin plugin field (tracks impersonator user id)
    impersonatedBy: varchar({ length: 255 }),
    createdAt: timestamp().notNull(),
    updatedAt: timestamp().notNull(),
  },
  (table) => [
    index('idx_sessions_user_id').on(table.userId),
    index('idx_sessions_token').on(table.token),
  ]
);

/**
 * ACCOUNTS TABLE
 * OAuth providers + email/password auth
 */
export const accounts = pgTable(
  'accounts',
  {
    id: varchar({ length: 255 }).primaryKey(),
    userId: varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: varchar({ length: 255 }).notNull(),
    providerId: varchar({ length: 255 }).notNull(),
    accessToken: text(),
    refreshToken: text(),
    accessTokenExpiresAt: timestamp(),
    refreshTokenExpiresAt: timestamp(),
    scope: text(),
    idToken: text(),
    password: varchar({ length: 255 }),
    createdAt: timestamp().notNull(),
    updatedAt: timestamp().notNull(),
  },
  (table) => [
    index('idx_accounts_user_id').on(table.userId),
    uniqueIndex('idx_accounts_provider').on(table.accountId, table.providerId),
  ]
);

/**
 * VERIFICATION TABLE
 * Email verification tokens, password reset tokens
 */
export const verification = pgTable(
  'verification',
  {
    id: varchar({ length: 255 }).primaryKey(),
    identifier: varchar({ length: 255 }).notNull(),
    value: varchar({ length: 255 }).notNull(),
    expiresAt: timestamp().notNull(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  (table) => [index('idx_verification_identifier').on(table.identifier)]
);

// ==================== CUSTOM APP TABLES ====================

/**
 * WORKSPACES TABLE
 * Multi-tenant container. Users belong to one+ workspaces.
 */
export const workspaces = pgTable(
  'workspaces',
  {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull().unique(),
    ownerUserId: varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    index('idx_workspaces_owner').on(table.ownerUserId),
    index('idx_workspaces_deleted').on(table.deletedAt),
  ]
);

/**
 * WORKSPACE_MEMBERS TABLE
 * Explicit membership + role (owner, member, viewer)
 */
export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: serial().primaryKey(),
    workspaceId: integer()
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar({ length: 50 }).notNull().default('member'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_workspace_members_unique').on(table.workspaceId, table.userId),
    index('idx_workspace_members_user').on(table.userId),
    index('idx_workspace_members_deleted').on(table.deletedAt),
  ]
);

/**
 * WORKSPACE_INVITATIONS TABLE
 * Pending invitations to join a workspace
 */
export const workspaceInvitations = pgTable(
  'workspace_invitations',
  {
    id: serial().primaryKey(),
    workspaceId: integer()
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    email: varchar({ length: 255 }).notNull(),
    role: varchar({ length: 50 }).notNull().default('member'),
    token: varchar({ length: 255 }).notNull().unique(),
    invitedByUserId: varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp().notNull(),
    acceptedAt: timestamp(),
    ...timestamps,
  },
  (table) => [
    index('idx_invitations_workspace').on(table.workspaceId),
    index('idx_invitations_email').on(table.email),
    index('idx_invitations_token').on(table.token),
    index('idx_invitations_deleted').on(table.deletedAt),
  ]
);

/**
 * SUBSCRIPTIONS TABLE
 * Stripe billing per workspace
 */
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: serial().primaryKey(),
    workspaceId: integer()
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    stripeCustomerId: varchar({ length: 255 }).unique(),
    stripeSubscriptionId: varchar({ length: 255 }).unique(),
    stripePriceId: varchar({ length: 255 }),
    status: varchar({ length: 50 }).notNull().default('incomplete'),
    currentPeriodStart: timestamp(),
    currentPeriodEnd: timestamp(),
    cancelAtPeriodEnd: boolean().default(false),
    ...timestamps,
  },
  (table) => [
    index('idx_subscriptions_workspace').on(table.workspaceId),
    index('idx_subscriptions_stripe_customer').on(table.stripeCustomerId),
    index('idx_subscriptions_stripe_subscription').on(table.stripeSubscriptionId),
    index('idx_subscriptions_deleted').on(table.deletedAt),
  ]
);

/**
 * STRIPE_EVENTS TABLE
 * Webhook idempotency + processing audit.
 */
export const stripeEvents = pgTable(
  'stripe_events',
  {
    id: serial().primaryKey(),
    stripeEventId: varchar({ length: 255 }).notNull().unique(),
    type: varchar({ length: 255 }).notNull(),
    status: varchar({ length: 32 }).notNull().default('received'),
    receivedAt: timestamp().defaultNow().notNull(),
    processedAt: timestamp(),
    error: text(),
  },
  (table) => [index('idx_stripe_events_event_id').on(table.stripeEventId)]
);

// ==================== RELATIONS ====================

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

// ==================== ZOD SCHEMAS ====================

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const selectWorkspaceSchema = createSelectSchema(workspaces);

export const insertWorkspaceMemberSchema = createInsertSchema(workspaceMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const selectWorkspaceMemberSchema = createSelectSchema(workspaceMembers);

export const insertWorkspaceInvitationSchema = createInsertSchema(workspaceInvitations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const selectWorkspaceInvitationSchema = createSelectSchema(workspaceInvitations);
