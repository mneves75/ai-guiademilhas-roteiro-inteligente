import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/db/client';

export default async function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
          <h1 className="text-2xl font-bold">User Details</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/users">Back to Users</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Basic account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Name:</span> {user.name ?? 'Unnamed'}
            </div>
            <div>
              <span className="font-medium">Email Verified:</span>{' '}
              {user.emailVerified ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-medium">Role:</span> {user.role ?? 'user'}
            </div>
            <div>
              <span className="font-medium">Created:</span>{' '}
              {new Date(user.createdAt).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspaces</CardTitle>
            <CardDescription>Memberships and roles</CardDescription>
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
              <p className="text-muted-foreground">No workspace memberships.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
