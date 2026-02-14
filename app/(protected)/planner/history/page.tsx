import { requireAuth } from '@/lib/auth';
import { getUserPlans, getUserPlansCount } from '@/db/queries/plans';
import { PlanHistoryList } from '@/components/planner/plan-history-list';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, normalizeLocale } from '@/lib/locale';
import { m } from '@/lib/messages';

const PAGE_SIZE = 10;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function PlanHistoryPage({ searchParams }: Props) {
  const session = await requireAuth();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = m(locale).planner.history;

  const [plans, totalCount] = await Promise.all([
    getUserPlans(session.user.id, PAGE_SIZE, offset),
    getUserPlansCount(session.user.id),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle(totalCount)}</p>
      </div>
      <PlanHistoryList plans={plans} currentPage={page} totalPages={totalPages} />
    </div>
  );
}
