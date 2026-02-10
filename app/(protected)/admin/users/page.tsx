import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAdminUsers } from '@/lib/admin';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminUserActions } from './user-actions';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { toIntlLocale } from '@/lib/intl';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const locale = await getRequestLocale();
  const t = m(locale);
  const intlLocale = toIntlLocale(locale);

  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam ?? '1');
  const { users, pagination } = await getAdminUsers(page, 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.admin.users.title}</h1>
          <p className="text-muted-foreground">{t.admin.users.subtitle(pagination.total)}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.admin.users.tableTitle}</CardTitle>
          <CardDescription>{t.admin.users.tableSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{t.admin.users.columns.user}</th>
                  <th className="px-4 py-3">{t.admin.users.columns.email}</th>
                  <th className="px-4 py-3">{t.admin.users.columns.workspaces}</th>
                  <th className="px-4 py-3">{t.admin.users.columns.joined}</th>
                  <th className="px-4 py-3">{t.admin.users.columns.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          {(user.name ?? user.email).charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{user.name ?? t.common.unnamedFallback}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">{user.workspaceMemberships?.length ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString(intlLocale)}
                    </td>
                    <td className="px-4 py-3">
                      <AdminUserActions userId={user.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t.admin.users.pageOf(pagination.page, pagination.totalPages)}
              </p>
              <div className="flex gap-2">
                {page <= 1 ? (
                  <Button variant="outline" size="sm" disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                    {t.admin.users.previous}
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/users?page=${Math.max(1, page - 1)}`}>
                      <ChevronLeft className="h-4 w-4" />
                      {t.admin.users.previous}
                    </Link>
                  </Button>
                )}

                {page >= pagination.totalPages ? (
                  <Button variant="outline" size="sm" disabled={page >= pagination.totalPages}>
                    {t.admin.users.next}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/users?page=${Math.min(pagination.totalPages, page + 1)}`}>
                      {t.admin.users.next}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
