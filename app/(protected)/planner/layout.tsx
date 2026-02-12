import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { buildLoginRedirectHref } from '@/lib/security/redirect';
import { PlannerHeader } from '@/components/planner/planner-header';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PlannerLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const auth = getAuth();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    redirect(buildLoginRedirectHref('/planner', { defaultPath: '/planner' }));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PlannerHeader user={session.user} />
      <main className="flex-1 bg-muted/30 p-4 md:p-6">
        <div className="mx-auto w-full max-w-4xl space-y-6">{children}</div>
      </main>
    </div>
  );
}
