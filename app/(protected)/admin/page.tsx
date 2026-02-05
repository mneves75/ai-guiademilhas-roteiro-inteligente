import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSystemStats, getRecentActivity } from '@/lib/admin';
import { Users, FolderKanban, CreditCard, TrendingUp } from 'lucide-react';

export default async function AdminDashboardPage() {
  const stats = await getSystemStats();
  const activity = await getRecentActivity(5);

  const statCards = [
    {
      name: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      description: `+${stats.newUsersLast7Days} in last 7 days`,
    },
    {
      name: 'Workspaces',
      value: stats.totalWorkspaces,
      icon: FolderKanban,
      description: 'Active workspaces',
    },
    {
      name: 'Subscriptions',
      value: stats.activeSubscriptions,
      icon: CreditCard,
      description: 'Active paid plans',
    },
    {
      name: 'Growth',
      value: `${stats.newUsersLast7Days > 0 ? '+' : ''}${stats.newUsersLast7Days}`,
      icon: TrendingUp,
      description: 'New users this week',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and management tools.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <div className="space-y-3">
                {activity.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        {(user.name ?? user.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name ?? 'Unnamed'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Workspaces</CardTitle>
            <CardDescription>Latest workspace creations</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.recentWorkspaces.length === 0 ? (
              <p className="text-sm text-muted-foreground">No workspaces yet.</p>
            ) : (
              <div className="space-y-3">
                {activity.recentWorkspaces.map((workspace) => (
                  <div key={workspace.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{workspace.name}</p>
                      <p className="text-xs text-muted-foreground">
                        by {workspace.owner?.name ?? workspace.owner?.email ?? 'Unknown'}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(workspace.createdAt).toLocaleDateString()}
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
