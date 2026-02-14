import type { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard-nav';
import { DashboardHeader } from '@/components/dashboard-header';
import { WorkspaceProvider } from '@/contexts/workspace-context';
import { buildLoginRedirectHref } from '@/lib/security/redirect';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect(buildLoginRedirectHref(null, { defaultPath: '/dashboard' }));
  }

  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen">
        <DashboardNav user={session.user} />
        <div className="flex flex-1 flex-col">
          <DashboardHeader user={session.user} impersonatedBy={null} />
          <main className="flex-1 bg-muted/30 p-6">{children}</main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
