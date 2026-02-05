/**
 * Schema barrel — exports dialect-agnostic types.
 *
 * For table references (used in queries), import from @/db/client instead.
 * For types only, import from here.
 */
export type {
  User,
  NewUser,
  Session,
  Account,
  Workspace,
  NewWorkspace,
  WorkspaceMember,
  NewWorkspaceMember,
  Subscription,
  NewSubscription,
  WorkspaceInvitation,
  NewWorkspaceInvitation,
  DbProvider,
} from './types';

// Re-export Zod schemas from PG schema (validation is dialect-agnostic)
export {
  insertWorkspaceSchema,
  selectWorkspaceSchema,
  insertWorkspaceMemberSchema,
  selectWorkspaceMemberSchema,
  insertWorkspaceInvitationSchema,
  selectWorkspaceInvitationSchema,
} from './postgres';
