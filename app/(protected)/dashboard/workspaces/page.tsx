import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUserWorkspaces } from '@/db/queries/workspaces';
import { Plus, Settings, Users } from 'lucide-react';

export default async function WorkspacesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const workspaces = await getUserWorkspaces(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground">Manage all your workspaces in one place.</p>
        </div>
        <Link href="/dashboard/workspaces/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Workspace
          </Button>
        </Link>
      </div>

      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No workspaces yet</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Create your first workspace to start collaborating with your team.
            </p>
            <Link href="/dashboard/workspaces/new" className="mt-4">
              <Button>Create Workspace</Button>
            </Link>
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
                    {role}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Link href={`/dashboard/workspaces/${workspace.id}/settings`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                  </Link>
                  <Link href={`/dashboard/workspaces/${workspace.id}/members`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Users className="mr-2 h-4 w-4" />
                      Members
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
