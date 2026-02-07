export const WORKSPACE_MEMBER_ROLES = ['owner', 'admin', 'member', 'viewer'] as const;
export type WorkspaceMemberRole = (typeof WORKSPACE_MEMBER_ROLES)[number];

export function isWorkspaceMemberRole(value: unknown): value is WorkspaceMemberRole {
  return typeof value === 'string' && (WORKSPACE_MEMBER_ROLES as readonly string[]).includes(value);
}

// Role targets that are safe to assign via invites.
export const INVITE_ROLES = ['admin', 'member', 'viewer'] as const;
export type InviteRole = (typeof INVITE_ROLES)[number];

export function isInviteRole(value: unknown): value is InviteRole {
  return typeof value === 'string' && (INVITE_ROLES as readonly string[]).includes(value);
}
