import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSystemStats, getRecentActivity } from '@/lib/admin';
import { Users, FolderKanban, CreditCard, DollarSign, TrendingUp } from 'lucide-react';
import type { User, Workspace } from '@/db/schema/types';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { toIntlLocale } from '@/lib/intl';

export default async function AdminDashboardPage() {
  const locale = await getRequestLocale();
  const t = m(locale);
  const intlLocale = toIntlLocale(locale);

  const stats = await getSystemStats();
  const activity = await getRecentActivity(5);

  const statCards = [
    {
      name: t.admin.dashboard.cards.totalUsers,
      value: stats.totalUsers,
      icon: Users,
      description: t.admin.dashboard.newUsersLast7Days(stats.newUsersLast7Days),
    },
    {
      name: t.admin.dashboard.cards.workspaces,
      value: stats.totalWorkspaces,
      icon: FolderKanban,
      description: t.admin.dashboard.activeWorkspaces,
    },
    {
      name: t.admin.dashboard.cards.subscriptions,
      value: stats.activeSubscriptions,
      icon: CreditCard,
      description: t.admin.dashboard.activePaidPlans,
    },
    {
      name: t.admin.dashboard.cards.estMrr,
      value: new Intl.NumberFormat(intlLocale, { style: 'currency', currency: 'USD' }).format(
        (stats.estimatedMrrCents ?? 0) / 100
      ),
      icon: DollarSign,
      description: t.admin.dashboard.bestEffortEstimate,
    },
    {
      name: t.admin.dashboard.cards.growth,
      value: `${stats.newUsersLast7Days > 0 ? '+' : ''}${stats.newUsersLast7Days}`,
      icon: TrendingUp,
      description: t.admin.dashboard.newUsersThisWeek,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.admin.dashboard.title}</h1>
        <p className="text-muted-foreground">{t.admin.dashboard.subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.admin.dashboard.recentUsers}</CardTitle>
            <CardDescription>{t.admin.dashboard.recentUsersSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.admin.dashboard.noUsersYet}</p>
            ) : (
              <div className="space-y-3">
                {activity.recentUsers.map((user: User) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        {(user.name ?? user.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {user.name ?? t.common.unnamedFallback}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString(intlLocale)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.admin.dashboard.recentWorkspaces}</CardTitle>
            <CardDescription>{t.admin.dashboard.recentWorkspacesSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.recentWorkspaces.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.admin.dashboard.noWorkspacesYet}</p>
            ) : (
              <div className="space-y-3">
                {activity.recentWorkspaces.map((workspace: Workspace & { owner?: User | null }) => (
                  <div key={workspace.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{workspace.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.admin.dashboard.by(
                          workspace.owner?.name ??
                            workspace.owner?.email ??
                            t.admin.workspaces.unknown
                        )}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(workspace.createdAt).toLocaleDateString(intlLocale)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
