import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUserWorkspaces } from '@/db/queries/workspaces';
import { Users, UserPlus } from 'lucide-react';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { buildLoginRedirectHref } from '@/lib/security/redirect';

export default async function TeamPage() {
  const auth = getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(buildLoginRedirectHref('/dashboard/team', { defaultPath: '/dashboard/team' }));
  }

  const locale = await getRequestLocale();
  const t = m(locale);

  const workspaces = await getUserWorkspaces(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard.team.title}</h1>
        <p className="text-muted-foreground">{t.dashboard.team.subtitle}</p>
      </div>

      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{t.dashboard.team.noWorkspacesYet}</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {t.dashboard.team.createWorkspaceFirst}
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/workspaces/new">{t.dashboard.team.createWorkspace}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {workspaces.map(({ workspace, role }) => (
            <Card key={workspace.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{workspace.name}</CardTitle>
                    <CardDescription>{t.dashboard.team.youAre(role, t.roles)}</CardDescription>
                  </div>
                  {(role === 'owner' || role === 'admin') && (
                    <Button asChild>
                      <Link href={`/dashboard/workspaces/${workspace.id}/members`}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        {t.dashboard.team.manageTeam}
                      </Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/dashboard/workspaces/${workspace.id}/members`}
                  className="text-sm text-primary hover:underline"
                >
                  {t.dashboard.team.viewAllMembers}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
