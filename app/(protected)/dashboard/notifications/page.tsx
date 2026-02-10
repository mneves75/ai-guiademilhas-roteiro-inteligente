import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Mail, Users } from 'lucide-react';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';

export default async function NotificationsPage() {
  const locale = await getRequestLocale();
  const t = m(locale);

  const notifications = [
    {
      id: 1,
      type: 'team',
      title: t.dashboard.notifications.seed.title,
      description: t.dashboard.notifications.seed.description,
      time: t.dashboard.notifications.seed.time,
      read: false,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.dashboard.notifications.title}</h1>
          <p className="text-muted-foreground">{t.dashboard.notifications.subtitle}</p>
        </div>
        <Button variant="outline" size="sm">
          <CheckCheck className="mr-2 h-4 w-4" />
          {t.dashboard.notifications.markAllRead}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.dashboard.notifications.all}</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t.dashboard.notifications.unread}
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.filter((n) => !n.read).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.dashboard.notifications.team}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter((n) => n.type === 'team').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.notifications.recentTitle}</CardTitle>
          <CardDescription>{t.dashboard.notifications.recentSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">{t.dashboard.notifications.noneTitle}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.dashboard.notifications.noneBody}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 py-4 ${!notification.read ? 'bg-muted/50' : ''}`}
                >
                  <div className="rounded-full bg-primary/10 p-2">
                    <notification.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                  {!notification.read && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
