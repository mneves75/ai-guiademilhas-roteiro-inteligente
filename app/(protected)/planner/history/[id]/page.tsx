import { requireAuth } from '@/lib/auth';
import { getPlanById } from '@/db/queries/plans';
import { notFound } from 'next/navigation';
import { plannerReportSchema } from '@/lib/planner/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportItemView } from '@/components/planner/report-item';
import { getItemText } from '@/lib/planner/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, normalizeLocale } from '@/lib/locale';
import { m } from '@/lib/messages';
import type { Locale } from '@/lib/locale';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PlanDetailPage({ params }: Props) {
  const session = await requireAuth();
  const { id } = await params;

  const plan = await getPlanById(id);
  if (!plan || plan.userId !== session.user.id) notFound();

  let report;
  try {
    const raw = JSON.parse(plan.report);
    const parsed = plannerReportSchema.safeParse(raw);
    if (!parsed.success) notFound();
    report = parsed.data;
  } catch {
    notFound();
  }

  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = m(locale).planner;
  const displayLocale = (plan.locale === 'en' ? 'en' : 'pt-BR') as Locale;

  const createdAt = plan.createdAt instanceof Date ? plan.createdAt : new Date(plan.createdAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/planner/history">{t.history.backToPlanner}</Link>
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <a href={`/api/planner/plans/${id}/pdf`} download>
            {locale === 'pt-BR' ? 'Baixar PDF' : 'Download PDF'}
          </a>
        </Button>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          {t.sharedCreatedAt}{' '}
          {createdAt.toLocaleDateString(displayLocale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{report.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">{report.summary}</p>

          <div className="space-y-4">
            {report.sections.map((section) => (
              <div key={section.title} className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {section.items.map((item, i) => (
                    <li key={`${getItemText(item)}-${i}`}>
                      <ReportItemView item={item} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {report.assumptions.length > 0 && (
            <div className="rounded-md border border-dashed border-muted-foreground/40 p-4">
              <h4 className="text-sm font-semibold">
                {displayLocale === 'pt-BR' ? 'Assuncoes' : 'Assumptions'}
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {report.assumptions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
