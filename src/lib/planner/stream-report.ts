import 'server-only';

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, Output } from 'ai';
import type { Locale } from '@/lib/locale';
import { plannerReportSchema, type TravelPreferencesInput } from './schema';
import {
  resolvePlannerProvider,
  resolvePlannerApiKey,
  resolvePlannerBaseUrl,
  resolvePlannerModelId,
  buildSystemPrompt,
  buildUserPrompt,
} from './prompt';
import { sectionOrder } from './strings';

export type StreamPlannerReportInput = {
  locale: Locale;
  preferences: TravelPreferencesInput;
  signal?: AbortSignal;
};

export function streamPlannerReport({ locale, preferences, signal }: StreamPlannerReportInput) {
  const provider = resolvePlannerProvider();
  const apiKey = resolvePlannerApiKey(provider);
  if (provider === 'google' && !apiKey) {
    throw new Error('PLANNER_API_KEY_MISSING');
  }

  const modelId = resolvePlannerModelId(provider);
  const model =
    provider === 'lmstudio'
      ? createOpenAI({
          apiKey: apiKey ?? 'lm-studio',
          baseURL: resolvePlannerBaseUrl(provider) ?? undefined,
          name: 'lmstudio',
        })(modelId)
      : createGoogleGenerativeAI({ apiKey: apiKey as string })(modelId);

  const titles = sectionOrder(locale);

  return streamText({
    model,
    temperature: 0.2,
    maxOutputTokens: 2400,
    output: Output.object({
      schema: plannerReportSchema,
      name: locale === 'pt-BR' ? 'relatorio_planejamento_milhas' : 'miles_planning_report',
    }),
    system: buildSystemPrompt(locale, { sectionOrder: titles }),
    prompt: buildUserPrompt(locale, preferences),
    abortSignal: signal,
  });
}
