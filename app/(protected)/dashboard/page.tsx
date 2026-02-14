import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUserWorkspaces } from '@/db/queries/workspaces';
import { Users, FolderKanban, CreditCard, ArrowRight, Plus, Plane } from 'lucide-react';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { buildLoginRedirectHref } from '@/lib/security/redirect';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect(buildLoginRedirectHref('/dashboard', { defaultPath: '/dashboard' }));
  }

  const locale = await getRequestLocale();
  const t = m(locale);

  const workspaces = await getUserWorkspaces(session.user.id);
  const roleLabel = (role: string) => {
    if (role === 'owner') return t.roles.owner;
    if (role === 'admin') return t.roles.admin;
    if (role === 'member') return t.roles.member;
    return role;
  };

  const stats = [
    {
      name: t.dashboard.overview.stats.workspaces,
      value: workspaces.length,
      icon: FolderKanban,
      href: '/dashboard/workspaces',
    },
    {
      name: t.dashboard.overview.stats.teamMembers,
      value: workspaces.reduce((acc) => acc + 1, 0), // Placeholder
      icon: Users,
      href: '/dashboard/team',
    },
    {
      name: t.dashboard.overview.stats.activePlan,
      value: t.dashboard.overview.stats.activePlanFree,
      icon: CreditCard,
      href: '/dashboard/billing',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t.dashboard.overview.welcomeBack(session.user.name ?? null)}
          </h1>
          <p className="text-muted-foreground">{t.dashboard.overview.subtitle}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/workspaces/new">
            <Plus className="mr-2 h-4 w-4" />
            {t.dashboard.overview.newWorkspace}
          </Link>
        </Button>
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
                {t.dashboard.overview.viewDetails}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Workspaces */}
      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.overview.yourWorkspaces}</CardTitle>
          <CardDescription>{t.dashboard.overview.yourWorkspacesSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {workspaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">{t.dashboard.overview.noWorkspacesYet}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.dashboard.overview.createFirstWorkspace}
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/workspaces/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t.dashboard.overview.createWorkspace}
                </Link>
              </Button>
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
                        {roleLabel(role)}
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
            <CardTitle>{t.dashboard.overview.quickActions}</CardTitle>
            <CardDescription>{t.dashboard.overview.quickActionsSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild className="w-full justify-start">
              <Link href="/planner">
                <Plane className="mr-2 h-4 w-4" />
                {t.dashboard.overview.actions.planTrip}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/workspaces/new">
                <Plus className="mr-2 h-4 w-4" />
                {t.dashboard.overview.actions.createNewWorkspace}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/team">
                <Users className="mr-2 h-4 w-4" />
                {t.dashboard.overview.actions.inviteTeamMembers}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/settings">
                <CreditCard className="mr-2 h-4 w-4" />
                {t.dashboard.overview.actions.updateProfile}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.overview.gettingStarted}</CardTitle>
            <CardDescription>{t.dashboard.overview.gettingStartedSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  ✓
                </div>
                <span className="text-sm">{t.dashboard.overview.steps.createAccount}</span>
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
                <span className="text-sm">{t.dashboard.overview.steps.createFirstWorkspace}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-xs text-muted-foreground">
                  3
                </div>
                <Link href="/planner" className="text-sm hover:text-primary hover:underline">
                  {t.dashboard.overview.steps.planFirstTrip}
                </Link>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-xs text-muted-foreground">
                  4
                </div>
                <span className="text-sm">{t.dashboard.overview.steps.inviteTeam}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-xs text-muted-foreground">
                  5
                </div>
                <span className="text-sm">{t.dashboard.overview.steps.setupBilling}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
