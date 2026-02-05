'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authClient } from '@/lib/auth-client';

type InviteInfo = {
  workspace: { name: string; slug: string };
  role: string;
  invitedBy: string;
  expiresAt: string;
};

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [session, setSession] = useState<{ user: { email: string } } | null>(null);

  useEffect(() => {
    async function loadData() {
      // Check session
      const { data: sessionData } = await authClient.getSession();
      setSession(sessionData);

      // Verify invitation
      const res = await fetch(`/api/invitations/accept?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setInvite(data);
      } else {
        const data = await res.json();
        setError(data.error ?? 'Invalid or expired invitation');
      }
      setIsLoading(false);
    }
    loadData();
  }, [token]);

  const handleAccept = async () => {
    setIsAccepting(true);
    setError(null);

    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to accept invitation');
      }

      const { workspaceId } = await res.json();
      router.push(`/dashboard?workspace=${workspaceId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Go Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in to continue</CardTitle>
            <CardDescription>
              You need to sign in to accept this invitation to {invite?.workspace.name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">
                <strong>Workspace:</strong> {invite?.workspace.name}
              </p>
              <p className="text-sm">
                <strong>Role:</strong> {invite?.role}
              </p>
              <p className="text-sm">
                <strong>Invited by:</strong> {invite?.invitedBy}
              </p>
            </div>
            <Link href={`/login?redirect=/invite/${token}`}>
              <Button className="w-full">Sign In</Button>
            </Link>
            <Link href={`/signup?redirect=/invite/${token}`}>
              <Button variant="outline" className="w-full">
                Create Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {invite?.workspace.name}</CardTitle>
          <CardDescription>
            {invite?.invitedBy} has invited you to join as a {invite?.role}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm">
              <strong>Workspace:</strong> {invite?.workspace.name}
            </p>
            <p className="text-sm">
              <strong>Role:</strong> {invite?.role}
            </p>
            <p className="text-sm">
              <strong>Your email:</strong> {session.user.email}
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" onClick={handleAccept} disabled={isAccepting}>
            {isAccepting ? 'Accepting...' : 'Accept Invitation'}
          </Button>

          <Link href="/dashboard">
            <Button variant="ghost" className="w-full">
              Cancel
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
