import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { withApiLogging } from '@/lib/logging';
import { getOrCreateRequestId } from '@/lib/request-id';
import { getPlanById, softDeletePlan } from '@/db/queries/plans';
import { problemJson } from '@/lib/planner/problem-response';

export const runtime = 'nodejs';

export const GET = withApiLogging(
  'api.planner.plans.get',
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const requestId = getOrCreateRequestId(request);
    const instance = request.nextUrl.pathname;
    const { id } = await context.params;

    try {
      const session = await getSession();

      if (!session) {
        return problemJson({
          status: 401,
          title: 'Unauthorized',
          detail: 'Authentication is required to view plans.',
          type: 'https://guiademilhas.app/problems/plans-unauthorized',
          instance,
          requestId,
          code: 'plans_unauthorized',
        });
      }

      const plan = await getPlanById(id);

      if (!plan) {
        return problemJson({
          status: 404,
          title: 'Not Found',
          detail: 'Plan not found or has been deleted.',
          type: 'https://guiademilhas.app/problems/plans-not-found',
          instance,
          requestId,
          code: 'plans_not_found',
        });
      }

      // Ownership check
      if (plan.userId !== session.user.id) {
        return problemJson({
          status: 403,
          title: 'Forbidden',
          detail: 'You do not have permission to view this plan.',
          type: 'https://guiademilhas.app/problems/plans-forbidden',
          instance,
          requestId,
          code: 'plans_forbidden',
        });
      }

      return NextResponse.json(
        {
          id: plan.id,
          title: plan.title,
          locale: plan.locale,
          mode: plan.mode,
          version: plan.version,
          parentId: plan.parentId,
          workspaceId: plan.workspaceId,
          preferences: JSON.parse(plan.preferences),
          report: JSON.parse(plan.report),
          createdAt: plan.createdAt.toISOString(),
          updatedAt: plan.updatedAt.toISOString(),
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
        detail: 'Unexpected error while retrieving plan.',
        type: 'https://guiademilhas.app/problems/plans-internal-error',
        instance,
        requestId,
        code: 'plans_internal_error',
      });
    }
  }
);

export const DELETE = withApiLogging(
  'api.planner.plans.delete',
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const requestId = getOrCreateRequestId(request);
    const instance = request.nextUrl.pathname;
    const { id } = await context.params;

    try {
      const session = await getSession();

      if (!session) {
        return problemJson({
          status: 401,
          title: 'Unauthorized',
          detail: 'Authentication is required to delete plans.',
          type: 'https://guiademilhas.app/problems/plans-unauthorized',
          instance,
          requestId,
          code: 'plans_unauthorized',
        });
      }

      const deleted = await softDeletePlan(id, session.user.id);

      if (!deleted) {
        return problemJson({
          status: 404,
          title: 'Not Found',
          detail: 'Plan not found or you do not have permission to delete it.',
          type: 'https://guiademilhas.app/problems/plans-not-found',
          instance,
          requestId,
          code: 'plans_not_found',
        });
      }

      return new Response(null, {
        status: 204,
        headers: {
          'x-request-id': requestId,
        },
      });
    } catch {
      return problemJson({
        status: 500,
        title: 'Internal Server Error',
        detail: 'Unexpected error while deleting plan.',
        type: 'https://guiademilhas.app/problems/plans-internal-error',
        instance,
        requestId,
        code: 'plans_internal_error',
      });
    }
  }
);
