import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';
import Link from 'next/link';
import { Shield, Users, FolderKanban, BarChart3, Settings, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

const navigation = [
  { name: 'Overview', href: '/admin', icon: BarChart3 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Workspaces', href: '/admin/workspaces', icon: FolderKanban },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  if (!isAdmin(session.user.email)) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-background">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Shield className="h-5 w-5 text-destructive" />
          <span className="font-semibold">Admin Panel</span>
        </div>

        <nav className="space-y-1 p-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      <main className="flex-1 bg-muted/30 p-6">{children}</main>
    </div>
  );
}
