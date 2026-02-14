import { NextResponse, type NextRequest } from 'next/server';
import { auditFromRequest } from '@/audit';
import { getSession } from '@/lib/auth';
import { isHttpError } from '@/lib/http';
import { readJsonBodyAs } from '@/lib/http-body';
import { withApiLogging } from '@/lib/logging';
import { getOrCreateRequestId } from '@/lib/request-id';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { plannerReportSchema } from '@/lib/planner/schema';
import { normalizeLocale } from '@/lib/locale';
import { createSharedReport } from '@/db/queries/shared-reports';
import { z } from 'zod';

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

export const runtime = 'nodejs';

const shareRequestSchema = z
  .object({
    report: plannerReportSchema,
    locale: z.string().optional(),
  })
  .strict();

export const POST = withApiLogging('api.planner.share', async (request: NextRequest) => {
  const requestId = getOrCreateRequestId(request);

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'x-request-id': requestId } }
      );
    }

    const rateLimit = await checkRateLimit({
      namespace: 'planner.share',
      identifier: session.user.id,
      max: RATE_LIMIT_MAX,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfterSeconds: rateLimit.retryAfterSeconds },
        { status: 429, headers: { 'x-request-id': requestId } }
      );
    }

    const body = await readJsonBodyAs(request, shareRequestSchema);
    const locale = normalizeLocale(body.locale);
    const reportJson = JSON.stringify(body.report);

    const record = await createSharedReport({
      creatorUserId: String(session.user.id),
      locale,
      reportJson,
    });

    auditFromRequest(request, {
      action: 'planner.share',
      actor: { userId: String(session.user.id) },
      metadata: { token: record.token, locale },
    });

    return NextResponse.json(
      { token: record.token, url: `/r/${record.token}` },
      { status: 201, headers: { 'x-request-id': requestId } }
    );
  } catch (err) {
    if (isHttpError(err) && err.expose) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status, headers: { 'x-request-id': requestId } }
      );
    }
    throw err;
  }
});
