'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authClient } from '@/lib/auth-client';
import { useLocale } from '@/contexts/locale-context';
import { m } from '@/lib/messages';
import { publicPathname } from '@/lib/locale-routing';

type InviteInfo = {
  workspace: { name: string; slug: string };
  role: string;
  invitedBy: string;
  expiresAt: string;
};

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { locale } = useLocale();
  const t = m(locale);
  const homePath = publicPathname(locale, '/');
  const roleLabel = (role: string) => {
    if (role === 'owner') return t.roles.owner;
    if (role === 'admin') return t.roles.admin;
    if (role === 'member') return t.roles.member;
    return role;
  };

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
        setError(data.error ?? t.invite.invalidOrExpired);
      }
      setIsLoading(false);
    }
    loadData();
  }, [token, t.invite.invalidOrExpired]);

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
        throw new Error(data.error ?? t.invite.acceptFailed);
      }

      const { workspaceId } = await res.json();
      router.push(`/dashboard?workspace=${workspaceId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.somethingWentWrong);
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{t.invite.loading}</p>
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
            <CardTitle className="text-destructive">{t.invite.invalidInvitationTitle}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href={homePath}>{t.invite.goHome}</Link>
            </Button>
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
            <CardTitle>{t.invite.signInToContinue}</CardTitle>
            <CardDescription>
              {t.invite.signInToAccept(invite?.workspace.name ?? '')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">
                <strong>{t.invite.workspaceLabel}</strong> {invite?.workspace.name}
              </p>
              <p className="text-sm">
                <strong>{t.invite.roleLabel}</strong> {invite?.role ? roleLabel(invite.role) : ''}
              </p>
              <p className="text-sm">
                <strong>{t.invite.invitedByLabel}</strong> {invite?.invitedBy}
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href={`/login?callbackUrl=/invite/${token}`}>{t.invite.signIn}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/signup?callbackUrl=/invite/${token}`}>{t.invite.createAccount}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t.invite.joinWorkspace(invite?.workspace.name ?? '')}</CardTitle>
          <CardDescription>
            {t.invite.invitedYouAs(
              invite?.invitedBy ?? '',
              invite?.role ? roleLabel(invite.role) : ''
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm">
              <strong>{t.invite.workspaceLabel}</strong> {invite?.workspace.name}
            </p>
            <p className="text-sm">
              <strong>{t.invite.roleLabel}</strong> {invite?.role ? roleLabel(invite.role) : ''}
            </p>
            <p className="text-sm">
              <strong>{t.invite.yourEmailLabel}</strong> {session.user.email}
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" onClick={handleAccept} disabled={isAccepting}>
            {isAccepting ? t.invite.accepting : t.invite.acceptInvitation}
          </Button>

          <Button asChild variant="ghost" className="w-full">
            <Link href="/dashboard">{t.invite.cancel}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
