import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react';

const stats = [
  { name: 'Total Views', value: '0', change: '+0%', icon: Eye },
  { name: 'Unique Visitors', value: '0', change: '+0%', icon: Users },
  { name: 'Growth', value: '0%', change: '+0%', icon: TrendingUp },
  { name: 'Avg. Session', value: '0m', change: '+0%', icon: BarChart3 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Monitor your workspace performance and usage.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <p className="text-xs text-muted-foreground">{stat.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Your workspace activity over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">Analytics charts coming soon</p>
                <p className="text-xs text-muted-foreground">
                  Connect your data sources to see insights
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages in your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">No data yet</p>
                <p className="text-xs text-muted-foreground">
                  Start using your workspace to see analytics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage by Feature</CardTitle>
          <CardDescription>How your team uses different features.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['Workspaces', 'Team Members', 'Invitations', 'Settings'].map((feature) => (
              <div key={feature} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium">{feature}</div>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: '0%' }} />
                  </div>
                </div>
                <div className="w-12 text-right text-sm text-muted-foreground">0</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
