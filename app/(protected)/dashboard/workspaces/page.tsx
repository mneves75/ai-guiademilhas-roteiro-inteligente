import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUserWorkspaces } from '@/db/queries/workspaces';
import { Plus, Settings, Users } from 'lucide-react';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { buildLoginRedirectHref } from '@/lib/security/redirect';

export default async function WorkspacesPage() {
  const session = await getSession();

  if (!session) {
    redirect(
      buildLoginRedirectHref('/dashboard/workspaces', { defaultPath: '/dashboard/workspaces' })
    );
  }

  const locale = await getRequestLocale();
  const t = m(locale);
  const roleLabel = (role: string) => {
    if (role === 'owner') return t.roles.owner;
    if (role === 'admin') return t.roles.admin;
    if (role === 'member') return t.roles.member;
    return role;
  };

  const workspaces = await getUserWorkspaces(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.dashboard.workspaces.title}</h1>
          <p className="text-muted-foreground">{t.dashboard.workspaces.subtitle}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/workspaces/new">
            <Plus className="mr-2 h-4 w-4" />
            {t.dashboard.workspaces.newWorkspace}
          </Link>
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{t.dashboard.workspaces.noWorkspacesYet}</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {t.dashboard.workspaces.noWorkspacesBody}
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/workspaces/new">{t.dashboard.workspaces.createWorkspace}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map(({ workspace, role }) => (
            <Card key={workspace.id} className="group relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{workspace.name}</CardTitle>
                    <CardDescription>/{workspace.slug}</CardDescription>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium capitalize">
                    {roleLabel(role)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/dashboard/workspaces/${workspace.id}/settings`}>
                      <Settings className="mr-2 h-4 w-4" />
                      {t.dashboard.workspaces.settings}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/dashboard/workspaces/${workspace.id}/members`}>
                      <Users className="mr-2 h-4 w-4" />
                      {t.dashboard.workspaces.members}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
