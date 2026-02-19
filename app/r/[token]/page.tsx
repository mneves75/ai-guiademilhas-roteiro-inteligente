import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSharedReportByToken } from '@/db/queries/shared-reports';
import { plannerReportSchema } from '@/lib/planner/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportItemView } from '@/components/planner/report-item';
import { getItemText } from '@/lib/planner/types';
import { m } from '@/lib/messages';
import type { Locale } from '@/lib/locale';

const TOKEN_PATTERN = /^[a-f0-9]{32}$/i;

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  if (!TOKEN_PATTERN.test(token)) return { title: 'Not Found' };

  const record = await getSharedReportByToken(token);
  if (!record) return { title: 'Not Found' };

  let title = 'Shared Travel Plan';
  try {
    const report = JSON.parse(record.reportJson);
    const parsed = plannerReportSchema.safeParse(report);
    if (parsed.success) title = parsed.data.title;
  } catch {
    // Use default title
  }

  return {
    title: `${title} | Guia de Milhas`,
    description: 'Travel plan generated with Guia de Milhas Planner',
    openGraph: {
      title: `${title} | Guia de Milhas`,
      description: 'Travel plan generated with Guia de Milhas Planner',
    },
  };
}

export default async function SharedReportPage({ params }: Props) {
  const { token } = await params;

  if (!TOKEN_PATTERN.test(token)) {
    notFound();
  }

  const record = await getSharedReportByToken(token);
  if (!record) {
    notFound();
  }

  let report;
  try {
    const raw = JSON.parse(record.reportJson);
    const parsed = plannerReportSchema.safeParse(raw);
    if (!parsed.success) notFound();
    report = parsed.data;
  } catch {
    notFound();
  }

  const createdAt =
    record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt);
  const locale = (record.locale === 'en' ? 'en' : 'pt-BR') as Locale;
  const t = m(locale).planner;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">{t.sharedBy}</p>
        <p className="text-xs text-muted-foreground">
          {t.sharedCreatedAt}{' '}
          {createdAt.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.sharedTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">{report.title}</h3>
            <p className="text-sm text-muted-foreground">{report.summary}</p>
          </div>

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
                {locale === 'pt-BR' ? 'Assunções' : 'Assumptions'}
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
