import 'server-only';

import type { Locale } from '@/lib/locale';
import type { PlannerReport } from './types';
import type { TravelPreferencesInput } from './schema';
import { buildSystemPrompt, buildUserPrompt } from './prompt';
import { normalizePlannerReportCandidate } from './normalize-report';

const LM_STUDIO_TOTAL_TIMEOUT_MS = 95_000;
const LM_STUDIO_MAX_ATTEMPT_MS = 75_000;
const LM_STUDIO_MIN_SECOND_ATTEMPT_MS = 20_000;

export async function generateViaLmStudio(params: {
  locale: Locale;
  preferences: TravelPreferencesInput;
  fallback: PlannerReport;
  modelId: string;
  fallbackModelId: string | null;
  baseUrl: string;
  apiKey: string;
  maxOutputTokens: number;
}): Promise<PlannerReport | null> {
  const {
    locale,
    preferences,
    fallback,
    modelId,
    fallbackModelId,
    baseUrl,
    apiKey,
    maxOutputTokens,
  } = params;
  const isPt = locale === 'pt-BR';

  const repairRules = isPt
    ? [
        'Retorne APENAS um objeto JSON válido, sem markdown e sem texto fora do JSON.',
        'Use este formato exato: {title, summary, sections:[{title, items}], assumptions}.',
        'sections precisa ter 4 a 8 seções; cada seção 2 a 6 itens.',
        'Cada item pode ser string OU objeto {text, tag, links}.',
        'tags permitidas: tip, warning, action, info.',
        'links.type permitido: search, book, info, map.',
      ].join(' ')
    : [
        'Return ONLY valid JSON, no markdown and no text outside JSON.',
        'Use this exact shape: {title, summary, sections:[{title, items}], assumptions}.',
        'sections must have 4 to 8 sections; each section 2 to 6 items.',
        'Each item can be a string OR an object {text, tag, links}.',
        'Allowed tags: tip, warning, action, info.',
        'Allowed links.type: search, book, info, map.',
      ].join(' ');

  const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, '');

  const extractMessageText = (responseBody: unknown): string | null => {
    if (typeof responseBody !== 'object' || responseBody === null) return null;
    const body = responseBody as Record<string, unknown>;
    const choices = body.choices;
    if (!Array.isArray(choices) || choices.length === 0) return null;
    const firstChoice = choices[0];
    if (typeof firstChoice !== 'object' || firstChoice === null) return null;
    const message = (firstChoice as Record<string, unknown>).message;
    if (typeof message !== 'object' || message === null) return null;
    const content = (message as Record<string, unknown>).content;

    if (typeof content === 'string') {
      const trimmed = content.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    if (Array.isArray(content)) {
      const text = content
        .map((part) => {
          if (typeof part === 'string') return part;
          if (typeof part !== 'object' || part === null) return '';
          const record = part as Record<string, unknown>;
          const piece = record.text;
          return typeof piece === 'string' ? piece : '';
        })
        .join('\n')
        .trim();
      return text.length > 0 ? text : null;
    }

    return null;
  };

  const requestLmStudio = async (options: {
    model: string;
    temperature: number;
    timeoutMs: number;
    responseFormat:
      | {
          type: 'json_schema';
          json_schema: {
            name: string;
            strict: boolean;
            schema: Record<string, unknown>;
          };
        }
      | { type: 'text' };
  }): Promise<string | null> => {
    if (options.timeoutMs <= 0) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const response = await fetch(`${normalizeBaseUrl(baseUrl)}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: options.model,
          temperature: options.temperature,
          max_tokens: maxOutputTokens,
          stream: false,
          response_format: options.responseFormat,
          messages: [
            {
              role: 'system',
              content: `${buildSystemPrompt(locale)}\n\n${repairRules}`,
            },
            {
              role: 'user',
              content: buildUserPrompt(locale, preferences),
            },
          ],
        }),
      });

      if (!response.ok) return null;
      const body = await response.json().catch(() => null);
      return extractMessageText(body);
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  };

  const schema: Record<string, unknown> = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      summary: { type: 'string' },
      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            items: {
              type: 'array',
              items: {
                anyOf: [
                  { type: 'string' },
                  {
                    type: 'object',
                    properties: {
                      text: { type: 'string' },
                      tag: { type: 'string' },
                      links: { type: 'array' },
                    },
                    required: ['text'],
                  },
                ],
              },
            },
          },
          required: ['title', 'items'],
        },
      },
      assumptions: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['title', 'summary', 'sections', 'assumptions'],
  };

  const modelCandidates = Array.from(
    new Set(
      [fallbackModelId, modelId]
        .map((entry) => entry?.trim())
        .filter((entry): entry is string => Boolean(entry))
    )
  );

  const startedAt = Date.now();
  const remainingMs = () => LM_STUDIO_TOTAL_TIMEOUT_MS - (Date.now() - startedAt);

  for (const candidateModel of modelCandidates) {
    const jsonAttemptTimeout = Math.min(
      35_000,
      LM_STUDIO_MAX_ATTEMPT_MS,
      Math.max(0, remainingMs() - 10_000)
    );
    if (jsonAttemptTimeout <= 0) break;

    const jsonContent = await requestLmStudio({
      model: candidateModel,
      temperature: 0,
      timeoutMs: jsonAttemptTimeout,
      responseFormat: {
        type: 'json_schema',
        json_schema: {
          name: locale === 'pt-BR' ? 'relatorio_planejamento_milhas' : 'miles_planning_report',
          strict: false,
          schema,
        },
      },
    });

    const normalizedJson =
      normalizePlannerReportCandidate({
        candidate: jsonContent,
        locale,
        fallback,
      }) ?? null;
    if (normalizedJson) return normalizedJson;

    const textAttemptTimeout = Math.min(
      25_000,
      LM_STUDIO_MAX_ATTEMPT_MS,
      Math.max(0, remainingMs() - 5_000)
    );
    if (textAttemptTimeout < LM_STUDIO_MIN_SECOND_ATTEMPT_MS) continue;

    const textContent = await requestLmStudio({
      model: candidateModel,
      temperature: 0,
      timeoutMs: textAttemptTimeout,
      responseFormat: { type: 'text' },
    });

    const normalizedText =
      normalizePlannerReportCandidate({
        candidate: textContent,
        locale,
        fallback,
      }) ?? null;
    if (normalizedText) return normalizedText;
  }

  return null;
}
