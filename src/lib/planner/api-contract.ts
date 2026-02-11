import type { PlannerReport } from './types';

export const PLANNER_API_SCHEMA_VERSION = '2026-02-11';

export type PlannerGenerationMode = 'ai' | 'fallback';

export type PlannerGenerateSuccessPayload = {
  schemaVersion: string;
  generatedAt: string;
  report: PlannerReport;
  mode: PlannerGenerationMode;
};

export type PlannerProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  requestId?: string;
  code?: string;
  retryAfterSeconds?: number;
  error?: string;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isPlannerReport(value: unknown): value is PlannerReport {
  if (!isObjectRecord(value)) return false;

  return (
    typeof value.title === 'string' &&
    typeof value.summary === 'string' &&
    Array.isArray(value.sections) &&
    Array.isArray(value.assumptions)
  );
}

function normalizeMode(value: unknown): PlannerGenerationMode {
  return value === 'ai' ? 'ai' : 'fallback';
}

export function parsePlannerGenerateSuccessPayload(
  value: unknown
): PlannerGenerateSuccessPayload | null {
  if (!isObjectRecord(value) || !isPlannerReport(value.report)) return null;

  return {
    schemaVersion:
      typeof value.schemaVersion === 'string' && value.schemaVersion.trim().length > 0
        ? value.schemaVersion
        : PLANNER_API_SCHEMA_VERSION,
    generatedAt:
      typeof value.generatedAt === 'string' && value.generatedAt.trim().length > 0
        ? value.generatedAt
        : '',
    report: value.report,
    mode: normalizeMode(value.mode),
  };
}

export function parsePlannerProblemDetails(value: unknown): PlannerProblemDetails | null {
  if (!isObjectRecord(value)) return null;
  if (
    typeof value.type !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.status !== 'number' ||
    typeof value.detail !== 'string' ||
    typeof value.instance !== 'string'
  ) {
    return null;
  }

  return {
    type: value.type,
    title: value.title,
    status: value.status,
    detail: value.detail,
    instance: value.instance,
    requestId: typeof value.requestId === 'string' ? value.requestId : undefined,
    code: typeof value.code === 'string' ? value.code : undefined,
    retryAfterSeconds:
      typeof value.retryAfterSeconds === 'number' ? value.retryAfterSeconds : undefined,
    error: typeof value.error === 'string' ? value.error : undefined,
  };
}
