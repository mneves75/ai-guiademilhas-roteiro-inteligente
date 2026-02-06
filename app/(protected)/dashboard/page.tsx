import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUserWorkspaces } from '@/db/queries/workspaces';
import { Users, FolderKanban, CreditCard, ArrowRight, Plus } from 'lucide-react';

export default async function DashboardPage() {
  const auth = getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const workspaces = await getUserWorkspaces(session.user.id);

  const stats = [
    {
      name: 'Workspaces',
      value: workspaces.length,
      icon: FolderKanban,
      href: '/dashboard/workspaces',
    },
    {
      name: 'Team Members',
      value: workspaces.reduce((acc) => acc + 1, 0), // Placeholder
      icon: Users,
      href: '/dashboard/team',
    },
    {
      name: 'Active Plan',
      value: 'Free',
      icon: CreditCard,
      href: '/dashboard/billing',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {session.user.name ?? 'there'}!</h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your account.
          </p>
        </div>
        <Link href="/dashboard/workspaces/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Workspace
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <Link
                href={stat.href}
                className="mt-2 inline-flex items-center text-sm text-primary hover:underline"
              >
                View details
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Workspaces */}
      <Card>
        <CardHeader>
          <CardTitle>Your Workspaces</CardTitle>
          <CardDescription>Quick access to your recent workspaces</CardDescription>
        </CardHeader>
        <CardContent>
          {workspaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No workspaces yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first workspace to get started.
              </p>
              <Link href="/dashboard/workspaces/new" className="mt-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workspace
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workspaces.slice(0, 6).map(({ workspace, role }) => (
                <Link
                  key={workspace.id}
                  href={`/dashboard/workspaces/${workspace.id}/settings`}
                  className="group"
                >
                  <div className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium group-hover:text-primary">{workspace.name}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                        {role}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">/{workspace.slug}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can do right now</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link href="/dashboard/workspaces/new">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create a new workspace
              </Button>
            </Link>
            <Link href="/dashboard/team">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Invite team members
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full justify-start">
                <CreditCard className="mr-2 h-4 w-4" />
                Update your profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Complete these steps to get the most out of Shipped</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  ✓
                </div>
                <span className="text-sm">Create your account</span>
              </li>
              <li className="flex items-center gap-3">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    workspaces.length > 0
                      ? 'bg-primary text-primary-foreground'
                      : 'border-2 border-muted-foreground/30 text-muted-foreground'
                  }`}
                >
                  {workspaces.length > 0 ? '✓' : '2'}
                </div>
                <span className="text-sm">Create your first workspace</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-xs text-muted-foreground">
                  3
                </div>
                <span className="text-sm">Invite your team</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-xs text-muted-foreground">
                  4
                </div>
                <span className="text-sm">Set up billing</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
