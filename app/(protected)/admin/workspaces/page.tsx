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

export default async function AdminWorkspacesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam ?? '1');
  const { workspaces, pagination } = await getAdminWorkspaces(page, 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground">Manage all workspaces ({pagination.total} total)</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Workspaces</CardTitle>
          <CardDescription>View and manage workspace accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Workspace</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
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
                        {workspace.owner?.email ?? 'Unknown'}
                      </td>
                      <td className="px-4 py-3">{workspace.members?.length ?? 0}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            activeSub ? 'bg-green-100 text-green-800' : 'bg-muted'
                          }`}
                        >
                          {activeSub ? 'Pro' : 'Free'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(workspace.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>View Members</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Delete Workspace
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
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Link href={`/admin/workspaces?page=${Math.max(1, page - 1)}`}>
                  <Button variant="outline" size="sm" disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                </Link>
                <Link href={`/admin/workspaces?page=${Math.min(pagination.totalPages, page + 1)}`}>
                  <Button variant="outline" size="sm" disabled={page >= pagination.totalPages}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
