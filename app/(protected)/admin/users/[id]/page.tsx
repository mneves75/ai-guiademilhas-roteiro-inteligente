import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/db/client';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { toIntlLocale } from '@/lib/intl';

export default async function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getRequestLocale();
  const t = m(locale);
  const intlLocale = toIntlLocale(locale);

  const { id } = await params;

  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, id),
    with: {
      workspaceMemberships: {
        with: { workspace: true },
      },
    },
  });

  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.admin.users.userDetails}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/users">{t.admin.users.backToUsers}</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.admin.users.profile}</CardTitle>
            <CardDescription>{t.admin.users.profileSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">{t.admin.users.name}</span>{' '}
              {user.name ?? t.common.unnamedFallback}
            </div>
            <div>
              <span className="font-medium">{t.admin.users.emailVerified}</span>{' '}
              {user.emailVerified ? t.admin.users.yes : t.admin.users.no}
            </div>
            <div>
              <span className="font-medium">{t.admin.users.role}</span> {user.role ?? 'user'}
            </div>
            <div>
              <span className="font-medium">{t.admin.users.created}</span>{' '}
              {new Date(user.createdAt).toLocaleString(intlLocale)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.admin.users.memberships}</CardTitle>
            <CardDescription>{t.admin.users.membershipsSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {user.workspaceMemberships?.length ? (
              <ul className="space-y-2">
                {user.workspaceMemberships.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <div>
                      <div className="font-medium">{m.workspace.name}</div>
                      <div className="text-xs text-muted-foreground">{m.workspace.slug}</div>
                    </div>
                    <div className="rounded bg-muted px-2 py-1 text-xs">{m.role}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">{t.admin.users.noMemberships}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
