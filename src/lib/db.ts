// Re-export client
export { db, dbEdge } from '@/db/client';

// Re-export queries
export * from '@/db/queries/users';
export * from '@/db/queries/workspaces';
export * from '@/db/queries/subscriptions';

// Re-export schema (for type definitions)
export * from '@/db/schema';
