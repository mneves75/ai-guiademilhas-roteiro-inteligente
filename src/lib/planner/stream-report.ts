import 'server-only';

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, Output } from 'ai';
import type { Locale } from '@/lib/locale';
import { plannerReportSchema, type TravelPreferencesInput } from './schema';
import {
  resolvePlannerApiKey,
  resolvePlannerModelId,
  buildSystemPrompt,
  buildUserPrompt,
} from './prompt';

export type StreamPlannerReportInput = {
  locale: Locale;
  preferences: TravelPreferencesInput;
  signal?: AbortSignal;
};

export function streamPlannerReport({ locale, preferences, signal }: StreamPlannerReportInput) {
  const apiKey = resolvePlannerApiKey();
  if (!apiKey) {
    throw new Error('PLANNER_API_KEY_MISSING');
  }

  const modelId = resolvePlannerModelId();
  const google = createGoogleGenerativeAI({ apiKey });

  const sectionOrder =
    locale === 'pt-BR'
      ? [
          'Resumo da Viagem',
          'Analise de Rotas',
          'Estrategia de Milhas',
          'Hospedagem',
          'Riscos e Mitigacoes',
          'Proximos Passos',
        ]
      : [
          'Trip Summary',
          'Route Analysis',
          'Miles Strategy',
          'Lodging',
          'Risks and Mitigations',
          'Next Steps',
        ];

  return streamText({
    model: google(modelId),
    temperature: 0.2,
    maxOutputTokens: 1800,
    output: Output.object({
      schema: plannerReportSchema,
      name: locale === 'pt-BR' ? 'relatorio_planejamento_milhas' : 'miles_planning_report',
    }),
    system: buildSystemPrompt(locale, { sectionOrder }),
    prompt: buildUserPrompt(locale, preferences),
    abortSignal: signal,
  });
}
