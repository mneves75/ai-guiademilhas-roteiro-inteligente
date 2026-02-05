'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, UserPlus, MoreVertical, Crown, Shield, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Member = {
  id: number;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

type Invitation = {
  id: number;
  email: string;
  role: string;
  expiresAt: string;
  invitedBy: {
    name: string | null;
    email: string;
  };
};

export default function WorkspaceMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteError, setInviteError] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const canManage = currentRole === 'owner' || currentRole === 'admin';

  const fetchData = useCallback(async () => {
    const [membersRes, wsRes] = await Promise.all([
      fetch(`/api/workspaces/${id}/members`),
      fetch(`/api/workspaces/${id}`),
    ]);

    if (membersRes.ok) {
      const data = await membersRes.json();
      setMembers(data.members);
    }

    if (wsRes.ok) {
      const data = await wsRes.json();
      setCurrentRole(data.role);
    }

    setIsLoading(false);
  }, [id]);

  // Fetch invitations separately when role is determined
  useEffect(() => {
    if (canManage) {
      fetch(`/api/workspaces/${id}/invitations`)
        .then((res) => res.json())
        .then((data) => setInvitations(data.invitations ?? []))
        .catch(() => {});
    }
  }, [id, canManage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setIsInviting(true);

    try {
      const res = await fetch(`/api/workspaces/${id}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send invitation');
      }

      setInviteEmail('');
      setInviteRole('member');
      setInviteDialogOpen(false);
      fetchData();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this member from the workspace?')) return;

    await fetch(`/api/workspaces/${id}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    fetchData();
  };

  const handleChangeRole = async (userId: string, role: string) => {
    await fetch(`/api/workspaces/${id}/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });

    fetchData();
  };

  const handleRevokeInvitation = async (invitationId: number) => {
    await fetch(`/api/workspaces/${id}/invitations`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId }),
    });

    fetchData();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return <div className="container py-8">Loading...</div>;
  }

  return (
    <div className="container max-w-2xl py-8">
      <Link
        href={`/dashboard/workspaces/${id}/settings`}
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Settings
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team Members</h1>
        {canManage && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleInvite}>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>Send an invitation to join this workspace.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium">
                      Role
                    </label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isInviting}>
                    {isInviting ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Members ({members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {member.user.image ? (
                        <Image
                          src={member.user.image}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {(member.user.name ?? member.user.email).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{member.user.name ?? 'Unnamed'}</p>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
                      {getRoleIcon(member.role)}
                      <span className="capitalize">{member.role}</span>
                    </div>
                    {canManage && member.role !== 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleChangeRole(
                                member.userId,
                                member.role === 'admin' ? 'member' : 'admin'
                              )
                            }
                          >
                            {member.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleRemoveMember(member.userId)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {canManage && invitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
              <CardDescription>Invitations that haven&apos;t been accepted yet.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited as {invitation.role} · Expires{' '}
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeInvitation(invitation.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
