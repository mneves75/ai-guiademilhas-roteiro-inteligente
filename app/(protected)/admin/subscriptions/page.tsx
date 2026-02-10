import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAdminSubscriptions } from '@/lib/admin';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { STRIPE_PLANS } from '@/lib/stripe';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { toIntlLocale } from '@/lib/intl';

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const locale = await getRequestLocale();
  const t = m(locale);
  const intlLocale = toIntlLocale(locale);

  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam ?? '1');
  const { subscriptions, pagination } = await getAdminSubscriptions(page, 20);

  function planLabel(priceId: string | null) {
    if (!priceId) return t.admin.workspaces.free;
    if (priceId === STRIPE_PLANS.pro.priceIds?.month || priceId === STRIPE_PLANS.pro.priceIds?.year)
      return t.admin.workspaces.pro;
    if (
      priceId === STRIPE_PLANS.enterprise.priceIds?.month ||
      priceId === STRIPE_PLANS.enterprise.priceIds?.year
    ) {
      return t.plans.enterprise.name;
    }
    return t.admin.workspaces.unknown;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.admin.subscriptions.title}</h1>
          <p className="text-muted-foreground">
            {t.admin.subscriptions.subtitle(pagination.total)}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.admin.subscriptions.tableTitle}</CardTitle>
          <CardDescription>{t.admin.subscriptions.tableSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{t.admin.subscriptions.columns.workspace}</th>
                  <th className="px-4 py-3">{t.admin.subscriptions.columns.plan}</th>
                  <th className="px-4 py-3">{t.admin.subscriptions.columns.status}</th>
                  <th className="px-4 py-3">{t.admin.subscriptions.columns.stripeCustomer}</th>
                  <th className="px-4 py-3">{t.admin.subscriptions.columns.stripeSubscription}</th>
                  <th className="px-4 py-3">{t.admin.subscriptions.columns.updated}</th>
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
                      {new Date(s.updatedAt).toLocaleDateString(intlLocale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t.admin.subscriptions.pageOf(pagination.page, pagination.totalPages)}
              </p>
              <div className="flex gap-2">
                {page <= 1 ? (
                  <Button variant="outline" size="sm" disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                    {t.admin.subscriptions.previous}
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/subscriptions?page=${Math.max(1, page - 1)}`}>
                      <ChevronLeft className="h-4 w-4" />
                      {t.admin.subscriptions.previous}
                    </Link>
                  </Button>
                )}

                {page >= pagination.totalPages ? (
                  <Button variant="outline" size="sm" disabled={page >= pagination.totalPages}>
                    {t.admin.subscriptions.next}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`/admin/subscriptions?page=${Math.min(pagination.totalPages, page + 1)}`}
                    >
                      {t.admin.subscriptions.next}
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
