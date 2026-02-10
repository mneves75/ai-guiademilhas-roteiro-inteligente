import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';

export default async function AdminSettingsPage() {
  const locale = await getRequestLocale();
  const t = m(locale);
  const ts = t.admin.settings;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{ts.title}</h1>
        <p className="text-muted-foreground">{ts.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{ts.generalTitle}</CardTitle>
          <CardDescription>{ts.generalSubtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app-name">{ts.appName}</Label>
            <Input id="app-name" defaultValue="Shipped" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-email">{ts.supportEmail}</Label>
            <Input id="support-email" type="email" defaultValue="support@shipped.dev" />
          </div>
          <Button>{ts.save}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ts.accessTitle}</CardTitle>
          <CardDescription>{ts.accessSubtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-emails">{ts.adminEmails}</Label>
            <Input
              id="admin-emails"
              placeholder={ts.adminEmailsPlaceholder}
              defaultValue={process.env.ADMIN_EMAILS ?? ''}
            />
            <p className="text-xs text-muted-foreground">{ts.adminEmailsHelp}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ts.flagsTitle}</CardTitle>
          <CardDescription>{ts.flagsSubtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{ts.userRegistration}</p>
              <p className="text-sm text-muted-foreground">{ts.userRegistrationHint}</p>
            </div>
            <Button variant="outline" size="sm">
              {ts.enabled}
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{ts.emailVerification}</p>
              <p className="text-sm text-muted-foreground">{ts.emailVerificationHint}</p>
            </div>
            <Button variant="outline" size="sm">
              {ts.disabled}
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{ts.maintenanceMode}</p>
              <p className="text-sm text-muted-foreground">{ts.maintenanceModeHint}</p>
            </div>
            <Button variant="outline" size="sm">
              {ts.disabled}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{ts.dangerTitle}</CardTitle>
          <CardDescription>{ts.dangerSubtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{ts.clearSessions}</p>
              <p className="text-sm text-muted-foreground">{ts.clearSessionsHint}</p>
            </div>
            <Button variant="destructive" size="sm">
              {ts.clearSessionsAction}
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{ts.resetDb}</p>
              <p className="text-sm text-muted-foreground">{ts.resetDbHint}</p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              {ts.resetDbAction}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
