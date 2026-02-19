import 'server-only';

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import type { Locale } from '@/lib/locale';
import type { PlannerReport } from './types';
import { plannerReportSchema, type TravelPreferencesInput } from './schema';
import {
  localizeEnum,
  resolvePlannerProvider,
  resolvePlannerApiKey,
  resolvePlannerBaseUrl,
  resolvePlannerModelId,
  resolvePlannerFallbackModelId,
  buildSystemPrompt,
  buildUserPrompt,
} from './prompt';
import {
  extractPlannerCandidateFromError,
  normalizePlannerReportCandidate,
} from './normalize-report';
import { generateViaLmStudio } from './lmstudio-provider';

const FALLBACK_ASSUMPTION_TOKEN = '__planner_fallback__';

export type GeneratePlannerReportInput = {
  locale: Locale;
  preferences: TravelPreferencesInput;
};

export type PlannerGenerationMode = 'ai' | 'fallback';

export type GeneratePlannerReportResult = {
  report: PlannerReport;
  mode: PlannerGenerationMode;
};

type PlannerModel = Parameters<typeof generateText>[0]['model'];

export function buildFallbackReport({
  locale,
  preferences,
  reason,
}: GeneratePlannerReportInput & {
  reason?: 'missing_api_key' | 'provider_failure';
}): PlannerReport {
  const isPt = locale === 'pt-BR';
  const totalPassengers = preferences.num_adultos + preferences.num_chd + preferences.num_inf;
  const assumptions: string[] = [];

  if (!preferences.programas_milhas.trim()) {
    assumptions.push(
      isPt
        ? 'Programas de milhas não informados; priorize programas com melhor taxa de transferência.'
        : 'Miles programs not provided; prioritize programs with stronger transfer rates.'
    );
  }
  if (!preferences.orcamento_brl.trim()) {
    assumptions.push(
      isPt
        ? 'Orçamento não informado; defina teto por pessoa antes da emissão.'
        : 'Budget not provided; define a per-passenger cap before booking.'
    );
  }
  if (!preferences.vistos_existentes.trim()) {
    assumptions.push(
      isPt
        ? 'Documentação não informada; valide vistos e requisitos sanitários antes de emitir.'
        : 'Documentation not provided; validate visas and entry requirements before issuing tickets.'
    );
  }
  assumptions.push(
    isPt
      ? 'Plano gerado em modo resiliente (fallback) por indisponibilidade temporária da IA.'
      : 'Plan generated in resilient fallback mode due to temporary AI unavailability.'
  );
  if (reason === 'missing_api_key') {
    assumptions.push(
      isPt
        ? 'Configure GOOGLE_GENERATIVE_AI_API_KEY para habilitar análise IA completa.'
        : 'Set GOOGLE_GENERATIVE_AI_API_KEY to enable full AI analysis.'
    );
  }

  const report: PlannerReport = {
    title: isPt ? 'Plano Estratégico de Emissão' : 'Strategic Redemption Plan',
    summary: isPt
      ? `Roteiro para ${totalPassengers} passageiro(s), priorizando custo-beneficio entre ${preferences.origens} e ${preferences.destinos}.`
      : `Plan for ${totalPassengers} traveler(s), prioritizing value between ${preferences.origens} and ${preferences.destinos}.`,
    sections: [
      {
        title: isPt ? 'Resumo da viagem' : 'Trip summary',
        items: [
          isPt
            ? `Periodo: ${preferences.data_ida} ate ${preferences.data_volta} (flexibilidade ${preferences.flex_dias} dias).`
            : `Window: ${preferences.data_ida} to ${preferences.data_volta} (${preferences.flex_dias}-day flexibility).`,
          isPt
            ? `Origens: ${preferences.origens}. Destinos candidatos: ${preferences.destinos}.`
            : `Origins: ${preferences.origens}. Candidate destinations: ${preferences.destinos}.`,
        ],
      },
      {
        title: isPt ? 'Estratégia de emissão' : 'Redemption strategy',
        items: [
          isPt
            ? '1) Busque primeiro rotas com melhor combinação de milhas + taxas; 2) compare com tarifa pagante; 3) emita no melhor valor líquido.'
            : '1) Search routes with best miles+fees first; 2) compare against cash fares; 3) issue on best net value.',
          isPt
            ? `Preferencia de voo: ${localizeEnum(locale, preferences.preferencia_voo)}; horarios: ${localizeEnum(locale, preferences.horarios_voo)}.`
            : `Flight preference: ${localizeEnum(locale, preferences.preferencia_voo)}; time window: ${localizeEnum(locale, preferences.horarios_voo)}.`,
        ],
      },
      {
        title: isPt ? 'Ordem de execução' : 'Execution order',
        items: [
          isPt
            ? 'Congele datas alternativas antes da busca para evitar dispersão.'
            : 'Freeze alternative dates before searching to avoid noisy comparisons.',
          isPt
            ? 'Valide bagagem e regras de conexão antes de confirmar emissão.'
            : 'Validate baggage and connection constraints before confirming booking.',
        ],
      },
      {
        title: isPt ? 'Riscos e mitigações' : 'Risks and mitigations',
        items: [
          isPt
            ? `Risco climatico (${localizeEnum(locale, preferences.tolerancia_risco)}): mantenha plano B em aeroporto alternativo.`
            : `Climate risk (${localizeEnum(locale, preferences.tolerancia_risco)}): keep a plan B with alternate airport options.`,
          isPt
            ? 'Não emita ida e volta em bilhetes separados sem checar política de alteração.'
            : 'Do not issue outbound/return on separate tickets without checking change policies.',
        ],
      },
      {
        title: isPt ? 'Próximos passos imediatos' : 'Immediate next steps',
        items: [
          isPt
            ? 'Defina limite de custo total (milhas + taxas) por passageiro.'
            : 'Define max total cost (miles + fees) per traveler.',
          isPt
            ? 'Execute busca em 2 janelas (data alvo e +/- flexibilidade) e selecione a melhor opção.'
            : 'Search across 2 windows (target date and +/- flexibility) and pick the best option.',
        ],
      },
    ],
    assumptions,
  };

  const parsed = plannerReportSchema.safeParse(report);
  if (!parsed.success) {
    const emergencyAssumptions = [
      isPt
        ? 'Não foi possível gerar análise detalhada. Revise os campos obrigatórios e tente novamente.'
        : 'Detailed analysis could not be generated. Review required fields and try again.',
      FALLBACK_ASSUMPTION_TOKEN,
    ];
    return {
      title: isPt ? 'Plano Básico de Viagem' : 'Basic Travel Plan',
      summary: isPt
        ? `Planejamento básico para ${totalPassengers} passageiro(s).`
        : `Basic planning for ${totalPassengers} traveler(s).`,
      sections: [
        {
          title: isPt ? 'Ações sugeridas' : 'Suggested actions',
          items: [
            isPt
              ? 'Revise origem, destino e datas antes de emitir.'
              : 'Review origin, destination, and dates before issuing.',
            isPt ? 'Compare milhas versus tarifa em dinheiro.' : 'Compare miles versus cash fares.',
          ],
        },
        {
          title: isPt ? 'Risco' : 'Risk',
          items: [
            isPt
              ? 'A indisponibilidade temporária da IA reduz a profundidade da análise.'
              : 'Temporary AI unavailability reduces analysis depth.',
            isPt
              ? 'Use verificação manual antes da compra.'
              : 'Use manual verification before booking.',
          ],
        },
        {
          title: isPt ? 'Prioridade' : 'Priority',
          items: [
            isPt ? 'Defina teto de custo por pessoa.' : 'Set per-passenger cost cap.',
            isPt
              ? 'Confirme regras de bagagem e conexão.'
              : 'Confirm baggage and connection rules.',
          ],
        },
        {
          title: isPt ? 'Próximo passo' : 'Next step',
          items: [
            isPt ? 'Tente novamente em alguns minutos.' : 'Retry in a few minutes.',
            isPt
              ? 'Persistindo, acione suporte tecnico.'
              : 'If persistent, contact technical support.',
          ],
        },
      ],
      assumptions: emergencyAssumptions,
    };
  }

  return parsed.data;
}

async function runStructuredObjectAttempt(params: {
  model: PlannerModel;
  locale: Locale;
  preferences: TravelPreferencesInput;
  fallback: PlannerReport;
  temperature: number;
  maxOutputTokens: number;
}): Promise<PlannerReport | null> {
  const { model, locale, preferences, fallback, temperature, maxOutputTokens } = params;

  try {
    const result = await generateText({
      model,
      temperature,
      maxOutputTokens,
      output: Output.object({
        schema: plannerReportSchema,
        name: locale === 'pt-BR' ? 'relatorio_planejamento_milhas' : 'miles_planning_report',
      }),
      system: buildSystemPrompt(locale),
      prompt: buildUserPrompt(locale, preferences),
    });

    return (
      normalizePlannerReportCandidate({
        candidate: result.output,
        locale,
        fallback,
      }) ?? null
    );
  } catch (error) {
    const candidate = extractPlannerCandidateFromError(error);
    return (
      normalizePlannerReportCandidate({
        candidate,
        locale,
        fallback,
      }) ?? null
    );
  }
}

export async function generatePlannerReport({
  locale,
  preferences,
}: GeneratePlannerReportInput): Promise<GeneratePlannerReportResult> {
  const baseline = buildFallbackReport({ locale, preferences, reason: 'provider_failure' });
  const baselineWithoutAssumptions: PlannerReport = {
    ...baseline,
    assumptions: [],
  };

  const provider = resolvePlannerProvider();
  const apiKey = resolvePlannerApiKey(provider);
  if (provider === 'google' && !apiKey) {
    return {
      mode: 'fallback',
      report: buildFallbackReport({ locale, preferences, reason: 'missing_api_key' }),
    };
  }

  const modelId = resolvePlannerModelId(provider);
  const isLmStudio = provider === 'lmstudio';
  if (isLmStudio) {
    const lmStudioBaseUrl = resolvePlannerBaseUrl(provider);
    const fallbackModelId = resolvePlannerFallbackModelId(provider);
    if (!lmStudioBaseUrl) {
      return {
        mode: 'fallback',
        report: baseline,
      };
    }
    const repaired = await generateViaLmStudio({
      locale,
      preferences,
      fallback: baselineWithoutAssumptions,
      modelId,
      fallbackModelId,
      baseUrl: lmStudioBaseUrl,
      apiKey: apiKey ?? 'lm-studio',
      maxOutputTokens: 1400,
    });
    if (repaired) {
      return {
        mode: 'ai',
        report: repaired,
      };
    }

    return {
      mode: 'fallback',
      report: baseline,
    };
  }

  const model = createGoogleGenerativeAI({ apiKey: apiKey as string })(modelId);

  const structured = await runStructuredObjectAttempt({
    model,
    locale,
    preferences,
    fallback: baselineWithoutAssumptions,
    temperature: 0.2,
    maxOutputTokens: 2400,
  });
  if (structured) {
    return {
      mode: 'ai',
      report: structured,
    };
  }

  return {
    mode: 'fallback',
    report: baseline,
  };
}
