import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard-nav';
import { DashboardHeader } from '@/components/dashboard-header';
import { WorkspaceProvider } from '@/contexts/workspace-context';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen">
        <DashboardNav user={session.user} />
        <div className="flex flex-1 flex-col">
          <DashboardHeader user={session.user} />
          <main className="flex-1 bg-muted/30 p-6">{children}</main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
