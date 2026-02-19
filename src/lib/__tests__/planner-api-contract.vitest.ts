import { describe, expect, it } from 'vitest';
import {
  PLANNER_API_SCHEMA_VERSION,
  parsePlannerGenerateSuccessPayload,
  parsePlannerProblemDetails,
} from '@/lib/planner/api-contract';

const validReport = {
  title: 'Plano estrategico de emissao',
  summary: 'Resumo objetivo com prioridade de emissao e mitigacoes de risco.',
  sections: [
    { title: 'Resumo', items: ['Janela de viagem definida', 'Rotas priorizadas'] },
    { title: 'Execucao', items: ['Buscar no programa A', 'Comparar com tarifa em dinheiro'] },
    { title: 'Riscos', items: ['Alta variacao de taxas', 'Monitorar disponibilidade'] },
    { title: 'Proximos passos', items: ['Emitir ida primeiro', 'Revalidar bagagem'] },
  ],
  assumptions: ['Sem disponibilidade em tempo real no momento da analise'],
};

describe('planner api contract', () => {
  it('parses v2 success payload', () => {
    const parsed = parsePlannerGenerateSuccessPayload({
      schemaVersion: PLANNER_API_SCHEMA_VERSION,
      generatedAt: '2026-02-11T03:00:00.000Z',
      mode: 'ai',
      report: validReport,
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.schemaVersion).toBe(PLANNER_API_SCHEMA_VERSION);
    expect(parsed?.mode).toBe('ai');
    expect(parsed?.report.title).toContain('Plano');
  });

  it('keeps backward compatibility for legacy success payload', () => {
    const parsed = parsePlannerGenerateSuccessPayload({
      report: validReport,
      mode: 'fallback',
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.schemaVersion).toBe(PLANNER_API_SCHEMA_VERSION);
    expect(parsed?.generatedAt).toBe('');
    expect(parsed?.mode).toBe('fallback');
  });

  it('rejects malformed success payload', () => {
    const parsed = parsePlannerGenerateSuccessPayload({
      schemaVersion: PLANNER_API_SCHEMA_VERSION,
      generatedAt: '2026-02-11T03:00:00.000Z',
      mode: 'ai',
      report: { title: 'x' },
    });

    expect(parsed).toBeNull();
  });

  it('parses RFC 9457-like planner errors', () => {
    const parsed = parsePlannerProblemDetails({
      type: 'https://guiademilhas.app/problems/planner-rate-limit',
      title: 'Too Many Requests',
      status: 429,
      detail: 'Rate limit exceeded for planner generation.',
      instance: '/api/planner/generate',
      requestId: 'req_12345678',
      code: 'planner_rate_limited',
      retryAfterSeconds: 30,
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.status).toBe(429);
    expect(parsed?.code).toBe('planner_rate_limited');
    expect(parsed?.retryAfterSeconds).toBe(30);
  });

  it('parses legacy error payload for backward compatibility', () => {
    const parsed = parsePlannerProblemDetails({
      error: 'Unauthorized',
      requestId: 'req_legacy_123',
      status: 401,
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.title).toBe('Unauthorized');
    expect(parsed?.status).toBe(401);
    expect(parsed?.requestId).toBe('req_legacy_123');
  });
});
