import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { withApiLogging } from '@/lib/logging';
import { getOrCreateRequestId } from '@/lib/request-id';
import { getUserPlans } from '@/db/queries/plans';
import { problemJson } from '@/lib/planner/problem-response';

export const runtime = 'nodejs';

export const GET = withApiLogging('api.planner.plans.list', async (request: NextRequest) => {
  const requestId = getOrCreateRequestId(request);
  const instance = request.nextUrl.pathname;

  try {
    const session = await getSession();

    if (!session) {
      return problemJson({
        status: 401,
        title: 'Unauthorized',
        detail: 'Authentication is required to list plans.',
        type: 'https://guiademilhas.app/problems/plans-unauthorized',
        instance,
        requestId,
        code: 'plans_unauthorized',
      });
    }

    const { searchParams } = request.nextUrl;
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = Math.min(Math.max(parseInt(limitParam ?? '20', 10) || 20, 1), 100);
    const offset = Math.max(parseInt(offsetParam ?? '0', 10) || 0, 0);

    // Busca limit+1 para detectar hasMore
    const results = await getUserPlans(session.user.id, limit + 1, offset);
    const hasMore = results.length > limit;
    const plans = hasMore ? results.slice(0, limit) : results;

    // Remove report/preferences para lista (muito grande)
    const plansList = plans.map((plan) => ({
      id: plan.id,
      title: plan.title,
      locale: plan.locale,
      mode: plan.mode,
      version: plan.version,
      createdAt: plan.createdAt.toISOString(),
    }));

    return NextResponse.json(
      {
        plans: plansList,
        hasMore,
      },
      {
        status: 200,
        headers: {
          'x-request-id': requestId,
        },
      }
    );
  } catch {
    return problemJson({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Unexpected error while listing plans.',
      type: 'https://guiademilhas.app/problems/plans-internal-error',
      instance,
      requestId,
      code: 'plans_internal_error',
    });
  }
});
