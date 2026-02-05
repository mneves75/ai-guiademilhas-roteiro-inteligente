// Re-export client
export { db, dbEdge } from '@/db/client';

// Re-export queries
export * from '@/db/queries/users';
export * from '@/db/queries/workspaces';
export * from '@/db/queries/subscriptions';

// Re-export types (for consumers that import types from here)
export type {
  User,
  Workspace,
  WorkspaceMember,
  Subscription,
  WorkspaceInvitation,
} from '@/db/schema';
