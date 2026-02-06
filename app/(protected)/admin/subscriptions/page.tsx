import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAdminSubscriptions } from '@/lib/admin';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { STRIPE_PLANS } from '@/lib/stripe';

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam ?? '1');
  const { subscriptions, pagination } = await getAdminSubscriptions(page, 20);

  function planLabel(priceId: string | null) {
    if (!priceId) return 'Free';
    if (priceId === STRIPE_PLANS.pro.priceIds?.month || priceId === STRIPE_PLANS.pro.priceIds?.year)
      return 'Pro';
    if (
      priceId === STRIPE_PLANS.enterprise.priceIds?.month ||
      priceId === STRIPE_PLANS.enterprise.priceIds?.year
    ) {
      return 'Enterprise';
    }
    return 'Unknown';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">View all subscriptions ({pagination.total} total)</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>Workspace billing records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Workspace</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Stripe Customer</th>
                  <th className="px-4 py-3">Stripe Subscription</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">
                          {s.workspace?.name ?? `#${s.workspaceId}`}
                        </div>
                        {s.workspace?.slug ? (
                          <div className="text-xs text-muted-foreground">/{s.workspace.slug}</div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">{planLabel(s.stripePriceId ?? null)}</td>
                    <td className="px-4 py-3">{s.status}</td>
                    <td className="px-4 py-3 font-mono text-xs">{s.stripeCustomerId ?? '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{s.stripeSubscriptionId ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(s.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Link href={`/admin/subscriptions?page=${Math.max(1, page - 1)}`}>
                  <Button variant="outline" size="sm" disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                </Link>
                <Link
                  href={`/admin/subscriptions?page=${Math.min(pagination.totalPages, page + 1)}`}
                >
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
