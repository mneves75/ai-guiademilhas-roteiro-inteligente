import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { initialTravelPreferences } from '@/lib/planner/constants';

const mocks = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockRateLimit: vi.fn(),
  mockGeneratePlannerReport: vi.fn(),
  mockStreamPlannerReport: vi.fn(),
  mockCaptureServerEvent: vi.fn(),
  mockIncPlannerFunnelGenerated: vi.fn(),
  mockCreatePlan: vi.fn(),
  mockSetCachedReport: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getSession: mocks.mockGetSession,
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: mocks.mockRateLimit,
}));

vi.mock('@/lib/planner/generate-report', () => ({
  buildFallbackReport: vi.fn(),
  generatePlannerReport: mocks.mockGeneratePlannerReport,
}));

vi.mock('@/lib/planner/stream-report', () => ({
  streamPlannerReport: mocks.mockStreamPlannerReport,
}));

vi.mock('@/lib/planner/prompt', () => ({
  resolvePlannerProvider: vi.fn(() => 'lmstudio'),
  resolvePlannerApiKey: vi.fn(() => 'lm-studio'),
  resolvePlannerModelId: vi.fn(() => 'qwen_qwen3-next-80b-a3b-instruct'),
}));

vi.mock('@/lib/analytics/posthog-server', () => ({
  captureServerEvent: mocks.mockCaptureServerEvent,
}));

vi.mock('@/lib/metrics', () => ({
  incPlannerFunnelGenerated: mocks.mockIncPlannerFunnelGenerated,
}));

vi.mock('@/lib/planner/cache', () => ({
  hashPreferences: vi.fn().mockResolvedValue('hash_stream_test_123'),
  getCachedReport: vi.fn().mockResolvedValue(null),
  setCachedReport: mocks.mockSetCachedReport.mockResolvedValue(undefined),
}));

vi.mock('@/db/queries/plans', () => ({
  createPlan: mocks.mockCreatePlan,
}));

vi.mock('@/audit', () => ({
  auditFromRequest: vi.fn(),
}));

import { POST } from '../../../app/api/planner/generate-stream/route';

const VALID_REPORT = {
  title: 'Plano Estrategico',
  summary: 'Resumo objetivo com passos acionaveis para emissao e mitigacao de risco.',
  sections: [
    { title: 'Resumo da Viagem', items: ['Trecho GRU-LIS.', 'Janela flexivel de 3 dias.'] },
    {
      title: 'Estrategia de Emissao',
      items: ['Priorizar voos diretos.', 'Comparar milhas vs cash.'],
    },
    {
      title: 'Riscos e Mitigacoes',
      items: ['Risco de indisponibilidade.', 'Mitigar com datas alternativas.'],
    },
    { title: 'Proximos Passos', items: ['Executar busca agora.', 'Emitir melhor opcao liquida.'] },
  ],
  assumptions: ['Disponibilidade sujeita a alteracoes sem aviso.'],
} as const;

function buildValidPayload() {
  return {
    locale: 'pt-BR',
    source: 'landing_planner',
    preferences: {
      ...initialTravelPreferences,
      data_ida: '2026-09-10',
      data_volta: '2026-09-20',
      origens: 'GRU',
      destinos: 'LIS, MAD',
      num_adultos: 2,
      num_chd: 0,
      num_inf: 0,
    },
  };
}

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/planner/generate-stream', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req_stream_test_001',
    },
    body: JSON.stringify(body),
  });
}

function parseSse(text: string): Array<Record<string, unknown>> {
  return text
    .split('\n\n')
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const line = block.split('\n').find((l) => l.startsWith('data: '));
      if (!line) return null;
      try {
        return JSON.parse(line.slice(6)) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter((event): event is Record<string, unknown> => event !== null);
}

describe('POST /api/planner/generate-stream (lmstudio)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGetSession.mockResolvedValue({
      user: { id: 'user_stream_1' },
      session: { impersonatedBy: null },
    });
    mocks.mockRateLimit.mockResolvedValue({ ok: true });
  });

  it('returns complete SSE in ai mode via lmstudio robust path', async () => {
    mocks.mockGeneratePlannerReport.mockResolvedValue({
      mode: 'ai',
      report: VALID_REPORT,
    });
    mocks.mockCreatePlan.mockResolvedValue({ id: 'plan_stream_123' });

    const response = await POST(createRequest(buildValidPayload()));
    const body = await response.text();
    const events = parseSse(body);
    const complete = events.find((event) => event.type === 'complete');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(complete).toEqual(
      expect.objectContaining({
        type: 'complete',
        mode: 'ai',
        planId: 'plan_stream_123',
      })
    );
    expect(mocks.mockStreamPlannerReport).not.toHaveBeenCalled();
    expect(mocks.mockSetCachedReport).toHaveBeenCalledTimes(1);
  });

  it('returns complete SSE in fallback mode when robust generation fails', async () => {
    mocks.mockGeneratePlannerReport.mockResolvedValue({
      mode: 'fallback',
      report: VALID_REPORT,
    });

    const response = await POST(createRequest(buildValidPayload()));
    const body = await response.text();
    const events = parseSse(body);
    const complete = events.find((event) => event.type === 'complete');

    expect(response.status).toBe(200);
    expect(complete).toEqual(
      expect.objectContaining({
        type: 'complete',
        mode: 'fallback',
      })
    );
    expect(mocks.mockCreatePlan).not.toHaveBeenCalled();
    expect(mocks.mockSetCachedReport).not.toHaveBeenCalled();
  });
});
