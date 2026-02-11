import { describe, expect, it, vi } from 'vitest';
import { initialTravelPreferences } from '@/lib/planner/constants';
import { generatePlannerReport } from '@/lib/planner/generate-report';
import { plannerGenerateRequestSchema } from '@/lib/planner/schema';

describe('plannerGenerateRequestSchema', () => {
  it('accepts a valid planner request payload', () => {
    const parsed = plannerGenerateRequestSchema.safeParse({
      locale: 'pt-BR',
      preferences: {
        ...initialTravelPreferences,
        data_ida: '2026-08-10',
        data_volta: '2026-08-20',
        origens: 'GRU',
        destinos: 'LIS, MAD',
        num_adultos: 2,
      },
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects invalid dates and passenger counts', () => {
    const parsed = plannerGenerateRequestSchema.safeParse({
      locale: 'pt-BR',
      preferences: {
        ...initialTravelPreferences,
        data_ida: '10/08/2026',
        data_volta: '2026-08-20',
        origens: 'GRU',
        destinos: 'LIS',
        num_adultos: 0,
      },
    });

    expect(parsed.success).toBe(false);
  });
});

describe('generatePlannerReport', () => {
  it('returns fallback report when AI key is missing', async () => {
    const previousGoogle = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const previousGemini = process.env.GEMINI_API_KEY;

    try {
      vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', '');
      vi.stubEnv('GEMINI_API_KEY', '');

      const result = await generatePlannerReport({
        locale: 'pt-BR',
        preferences: {
          ...initialTravelPreferences,
          data_ida: '2026-08-10',
          data_volta: '2026-08-20',
          origens: 'GRU',
          destinos: 'LIS',
          num_adultos: 1,
        },
      });

      expect(result.mode).toBe('fallback');
      expect(result.report.title.length).toBeGreaterThan(5);
      expect(result.report.sections.length).toBeGreaterThanOrEqual(4);
      expect(result.report.assumptions.join(' ').toLowerCase()).toContain('fallback');
    } finally {
      if (previousGoogle === undefined) {
        delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      } else {
        vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', previousGoogle);
      }

      if (previousGemini === undefined) {
        delete process.env.GEMINI_API_KEY;
      } else {
        vi.stubEnv('GEMINI_API_KEY', previousGemini);
      }
    }
  });
});
