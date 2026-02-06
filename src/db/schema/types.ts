/**
 * Centralized type definitions — dialect-agnostic.
 *
 * These are manually defined to match both PG and SQLite schemas.
 * Consumer code imports types from here (or from @/db/schema barrel).
 * This avoids coupling type consumers to a specific dialect.
 */

// ==================== TABLE TYPES ====================

export type User = {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string | null;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewUser = Omit<
  User,
  'emailVerified' | 'image' | 'role' | 'banned' | 'banReason' | 'banExpires'
> & {
  emailVerified?: boolean;
  image?: string | null;
  role?: string | null;
  banned?: boolean;
  banReason?: string | null;
  banExpires?: Date | null;
};

export type Session = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  impersonatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Account = {
  id: string;
  userId: string;
  accountId: string;
  providerId: string;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  scope: string | null;
  idToken: string | null;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Workspace = {
  id: number;
  name: string;
  slug: string;
  ownerUserId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type NewWorkspace = Omit<Workspace, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export type WorkspaceMember = {
  id: number;
  workspaceId: number;
  userId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type NewWorkspaceMember = Omit<
  WorkspaceMember,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export type Subscription = {
  id: number;
  workspaceId: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type NewSubscription = Omit<Subscription, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export type StripeEvent = {
  id: number;
  stripeEventId: string;
  type: string;
  status: string;
  receivedAt: Date;
  processedAt: Date | null;
  error: string | null;
};

export type WorkspaceInvitation = {
  id: number;
  workspaceId: number;
  email: string;
  role: string;
  token: string;
  invitedByUserId: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type NewWorkspaceInvitation = Omit<
  WorkspaceInvitation,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

// ==================== DB PROVIDER ====================

export type DbProvider = 'postgres' | 'sqlite' | 'd1';
