import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { initialTravelPreferences } from '@/lib/planner/constants';
import { PLANNER_API_SCHEMA_VERSION } from '@/lib/planner/api-contract';

const mocks = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockRateLimit: vi.fn(),
  mockGeneratePlannerReport: vi.fn(),
  mockAudit: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock('@/lib/auth', () => ({
  getAuth: () => ({
    api: {
      getSession: mocks.mockGetSession,
    },
  }),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: mocks.mockRateLimit,
}));

vi.mock('@/lib/planner/generate-report', () => ({
  generatePlannerReport: mocks.mockGeneratePlannerReport,
}));

vi.mock('@/audit', () => ({
  auditFromRequest: mocks.mockAudit,
}));

import { POST } from '../../../app/api/planner/generate/route';

function buildValidPayload() {
  return {
    locale: 'pt-BR',
    preferences: {
      ...initialTravelPreferences,
      data_ida: '2026-08-10',
      data_volta: '2026-08-20',
      origens: 'GRU',
      destinos: 'LIS, MAD',
      num_adultos: 2,
    },
  };
}

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/planner/generate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req_test_route_12345678',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/planner/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is unauthenticated', async () => {
    mocks.mockGetSession.mockResolvedValueOnce(null);

    const response = await POST(createRequest(buildValidPayload()));
    const payload = (await response.json()) as { error?: string; requestId?: string };

    expect(response.status).toBe(401);
    expect(payload.error).toBe('Unauthorized');
    expect(payload.requestId).toBeTruthy();
  });

  it('returns RFC 9457 problem+json on planner rate limit', async () => {
    mocks.mockGetSession.mockResolvedValueOnce({
      user: { id: 'user_123' },
      session: { impersonatedBy: null },
    });
    mocks.mockRateLimit.mockResolvedValueOnce({ ok: false, retryAfterSeconds: 12 });

    const response = await POST(createRequest(buildValidPayload()));
    const payload = (await response.json()) as {
      type: string;
      title: string;
      status: number;
      detail: string;
      instance: string;
      code: string;
      retryAfterSeconds: number;
      error: string;
      requestId: string;
    };

    expect(response.status).toBe(429);
    expect(response.headers.get('content-type')).toContain('application/problem+json');
    expect(response.headers.get('retry-after')).toBe('12');
    expect(payload.type).toBe('https://guiademilhas.app/problems/planner-rate-limit');
    expect(payload.code).toBe('planner_rate_limited');
    expect(payload.status).toBe(429);
    expect(payload.retryAfterSeconds).toBe(12);
    expect(payload.error).toBe('Too Many Requests');
    expect(payload.requestId).toBeTruthy();
  });

  it('returns versioned planner payload on success', async () => {
    mocks.mockGetSession.mockResolvedValueOnce({
      user: { id: 'user_123' },
      session: { impersonatedBy: null },
    });
    mocks.mockRateLimit.mockResolvedValueOnce({ ok: true });
    mocks.mockGeneratePlannerReport.mockResolvedValueOnce({
      mode: 'fallback',
      report: {
        title: 'Plano de emissao',
        summary: 'Resumo com prioridades de busca e emissao.',
        sections: [
          { title: 'Resumo', items: ['Rotas priorizadas', 'Datas definidas'] },
          { title: 'Execucao', items: ['Buscar em programa X', 'Comparar com tarifa pagante'] },
          { title: 'Riscos', items: ['Variacao de taxa', 'Janela curta de disponibilidade'] },
          { title: 'Acao', items: ['Emitir ida primeiro', 'Revalidar bagagem'] },
        ],
        assumptions: ['Sem disponibilidade em tempo real'],
      },
    });

    const response = await POST(createRequest(buildValidPayload()));
    const payload = (await response.json()) as {
      schemaVersion: string;
      generatedAt: string;
      mode: string;
      report: { title: string };
    };

    expect(response.status).toBe(200);
    expect(payload.schemaVersion).toBe(PLANNER_API_SCHEMA_VERSION);
    expect(payload.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(payload.mode).toBe('fallback');
    expect(payload.report.title).toBe('Plano de emissao');
    expect(mocks.mockAudit).toHaveBeenCalledTimes(1);
  });
});
