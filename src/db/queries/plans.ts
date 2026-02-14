import { eq, count } from 'drizzle-orm';
import { db } from '@/db/client';
import { plans } from '@/db/schema/postgres';
import { withSoftDeleteFilter, softDeleteNow, buildConditions } from './base';

/**
 * Gera ID único para plano (UUID v4).
 */
function generatePlanId(): string {
  return globalThis.crypto.randomUUID();
}

/**
 * Cria novo plano de viagem.
 * @returns Plano criado com todos os campos.
 */
export async function createPlan(input: {
  userId: string;
  locale: string;
  title: string;
  preferences: string;
  report: string;
  mode: string;
  workspaceId?: number | null;
  parentId?: string | null;
  version?: number;
}): Promise<NonNullable<Awaited<ReturnType<typeof db.query.plans.findFirst>>>> {
  const id = generatePlanId();
  const now = new Date();

  await db.insert(plans).values({
    id,
    userId: input.userId,
    workspaceId: input.workspaceId ?? null,
    locale: input.locale,
    title: input.title,
    preferences: input.preferences,
    report: input.report,
    mode: input.mode,
    version: input.version ?? 1,
    parentId: input.parentId ?? null,
    createdAt: now,
    updatedAt: now,
  });

  const result = await db.query.plans.findFirst({
    where: (p, { eq, and }) => and(eq(p.id, id), withSoftDeleteFilter(p)),
  });

  if (!result) {
    throw new Error(`Failed to retrieve created plan with id: ${id}`);
  }

  return result;
}

/**
 * Lista planos do usuário (paginado, ordenado por createdAt desc).
 * Exclui planos soft-deleted.
 */
export async function getUserPlans(
  userId: string,
  limit = 20,
  offset = 0
): Promise<Array<NonNullable<Awaited<ReturnType<typeof db.query.plans.findFirst>>>>> {
  const results = await db.query.plans.findMany({
    where: (p, { eq, and }) => and(eq(p.userId, userId), withSoftDeleteFilter(p)),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
    limit,
    offset,
  });

  return results;
}

/**
 * Busca plano por ID.
 * Retorna null se não encontrado ou soft-deleted.
 */
export async function getPlanById(
  id: string
): Promise<NonNullable<Awaited<ReturnType<typeof db.query.plans.findFirst>>> | null> {
  const result = await db.query.plans.findFirst({
    where: (p, { eq, and }) => and(eq(p.id, id), withSoftDeleteFilter(p)),
  });

  return result ?? null;
}

/**
 * Conta total de planos do usuário (excluindo soft-deleted).
 */
export async function getUserPlansCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(plans)
    .where(buildConditions(eq(plans.userId, userId), withSoftDeleteFilter(plans)));
  return result[0]?.count ?? 0;
}

/**
 * Soft delete de plano.
 * Valida ownership antes de deletar.
 * @returns true se deletado, false se não encontrado ou userId não corresponde.
 */
export async function softDeletePlan(id: string, userId: string): Promise<boolean> {
  // Verifica ownership
  const existing = await db.query.plans.findFirst({
    where: (p, { eq, and }) => and(eq(p.id, id), withSoftDeleteFilter(p)),
    columns: {
      userId: true,
    },
  });

  if (!existing || existing.userId !== userId) {
    return false;
  }

  // Executa soft delete
  await db.update(plans).set(softDeleteNow()).where(eq(plans.id, id));

  return true;
}
