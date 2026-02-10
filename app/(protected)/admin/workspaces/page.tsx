import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAdminWorkspaces } from '@/lib/admin';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { toIntlLocale } from '@/lib/intl';

export default async function AdminWorkspacesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const locale = await getRequestLocale();
  const t = m(locale);
  const intlLocale = toIntlLocale(locale);

  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam ?? '1');
  const { workspaces, pagination } = await getAdminWorkspaces(page, 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.admin.workspaces.title}</h1>
          <p className="text-muted-foreground">{t.admin.workspaces.subtitle(pagination.total)}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.admin.workspaces.tableTitle}</CardTitle>
          <CardDescription>{t.admin.workspaces.tableSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{t.admin.workspaces.columns.workspace}</th>
                  <th className="px-4 py-3">{t.admin.workspaces.columns.owner}</th>
                  <th className="px-4 py-3">{t.admin.workspaces.columns.members}</th>
                  <th className="px-4 py-3">{t.admin.workspaces.columns.plan}</th>
                  <th className="px-4 py-3">{t.admin.workspaces.columns.created}</th>
                  <th className="px-4 py-3">{t.admin.workspaces.columns.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {workspaces.map((workspace) => {
                  const activeSub = workspace.subscriptions?.find(
                    (s) => s.status === 'active' && !s.deletedAt
                  );
                  return (
                    <tr key={workspace.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{workspace.name}</p>
                          <p className="text-xs text-muted-foreground">/{workspace.slug}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {workspace.owner?.email ?? t.admin.workspaces.unknown}
                      </td>
                      <td className="px-4 py-3">{workspace.members?.length ?? 0}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            activeSub ? 'bg-green-100 text-green-800' : 'bg-muted'
                          }`}
                        >
                          {activeSub ? t.admin.workspaces.pro : t.admin.workspaces.free}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(workspace.createdAt).toLocaleDateString(intlLocale)}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>{t.admin.workspaces.viewDetails}</DropdownMenuItem>
                            <DropdownMenuItem>{t.admin.workspaces.viewMembers}</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              {t.admin.workspaces.deleteWorkspace}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t.admin.workspaces.pageOf(pagination.page, pagination.totalPages)}
              </p>
              <div className="flex gap-2">
                {page <= 1 ? (
                  <Button variant="outline" size="sm" disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                    {t.admin.workspaces.previous}
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/workspaces?page=${Math.max(1, page - 1)}`}>
                      <ChevronLeft className="h-4 w-4" />
                      {t.admin.workspaces.previous}
                    </Link>
                  </Button>
                )}

                {page >= pagination.totalPages ? (
                  <Button variant="outline" size="sm" disabled={page >= pagination.totalPages}>
                    {t.admin.workspaces.next}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`/admin/workspaces?page=${Math.min(pagination.totalPages, page + 1)}`}
                    >
                      {t.admin.workspaces.next}
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
