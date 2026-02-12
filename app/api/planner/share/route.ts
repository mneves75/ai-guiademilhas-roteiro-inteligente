import { NextResponse, type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { auditFromRequest } from '@/audit';
import { getAuth } from '@/lib/auth';
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

const shareRequestSchema = z.object({
  report: plannerReportSchema,
  locale: z.string().optional(),
});

export const POST = withApiLogging('api.planner.share', async (request: NextRequest) => {
  const requestId = getOrCreateRequestId(request);

  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      { status: 429 }
    );
  }

  let body: z.infer<typeof shareRequestSchema>;
  try {
    const raw = await request.json();
    const parsed = shareRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

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
});
