import { NextResponse, type NextRequest } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { getSession } from '@/lib/auth';
import { getPlanById } from '@/db/queries/plans';
import { plannerReportSchema } from '@/lib/planner/schema';
import { PlannerPdfDocument } from '@/components/planner/pdf/planner-pdf-document';
import { getOrCreateRequestId } from '@/lib/request-id';

type PdfElement = Parameters<typeof renderToBuffer>[0];

export const runtime = 'nodejs';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const requestId = getOrCreateRequestId(request);
  const { id } = await params;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const plan = await getPlanById(id);
  if (!plan || plan.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let report;
  try {
    const raw = JSON.parse(plan.report);
    const parsed = plannerReportSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid report data' }, { status: 422 });
    }
    report = parsed.data;
  } catch {
    return NextResponse.json({ error: 'Invalid report data' }, { status: 422 });
  }

  try {
    const element = React.createElement(PlannerPdfDocument, {
      report,
      locale: plan.locale,
    }) as PdfElement;
    const buffer = await renderToBuffer(element);

    const filename = `plano-${id.slice(0, 8)}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'x-request-id': requestId,
      },
    });
  } catch (err) {
    console.error('[pdf] render failed', {
      requestId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
