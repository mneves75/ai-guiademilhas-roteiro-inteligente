import 'server-only';

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import type { Locale } from '@/lib/locale';
import type { PlannerReport } from './types';
import { plannerReportSchema, type TravelPreferencesInput } from './schema';

const DEFAULT_PLANNER_MODEL = 'gemini-2.5-flash';
const FALLBACK_ASSUMPTION_TOKEN = '__planner_fallback__';

function resolvePlannerApiKey(): string | null {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
  const trimmed = key?.trim();
  return trimmed ? trimmed : null;
}

function resolvePlannerModelId(): string {
  const configured = process.env.PLANNER_GOOGLE_MODEL?.trim();
  return configured || DEFAULT_PLANNER_MODEL;
}

function localizeEnum(locale: Locale, value: string): string {
  if (locale === 'en') {
    const map: Record<string, string> = {
      direto: 'direct flights only',
      '1_conexao': 'up to 1 layover',
      indiferente: 'no strict preference',
      qualquer: 'any time',
      manha: 'morning',
      tarde: 'afternoon',
      noite: 'evening',
      madrugada: 'late night',
      evitar_madrugada: 'avoid late night',
      mao: 'carry-on only',
      '1_despachada': '1 checked bag',
      mais_despachadas: '2+ checked bags',
      baixa: 'low',
      media: 'medium',
      alta: 'high',
    };
    return map[value] ?? value;
  }

  const map: Record<string, string> = {
    direto: 'somente voos diretos',
    '1_conexao': 'ate 1 conexao',
    indiferente: 'sem preferencia rigida',
    qualquer: 'qualquer horario',
    manha: 'manha',
    tarde: 'tarde',
    noite: 'noite',
    madrugada: 'madrugada',
    evitar_madrugada: 'evitar madrugada',
    mao: 'somente bagagem de mao',
    '1_despachada': '1 bagagem despachada',
    mais_despachadas: '2+ bagagens despachadas',
    baixa: 'baixa',
    media: 'media',
    alta: 'alta',
  };
  return map[value] ?? value;
}

function formatPromptContext(locale: Locale, preferences: TravelPreferencesInput): string {
  const isPt = locale === 'pt-BR';

  const context = {
    locale,
    trip: {
      outboundDate: preferences.data_ida,
      returnDate: preferences.data_volta,
      flexibilityDays: preferences.flex_dias,
      origins: preferences.origens,
      candidateDestinations: preferences.destinos,
    },
    travelers: {
      adults: preferences.num_adultos,
      children: preferences.num_chd,
      infants: preferences.num_inf,
      agesChildrenInfants: preferences.idades_chd_inf || (isPt ? 'Nao informado' : 'Not provided'),
    },
    flight: {
      preference: localizeEnum(locale, preferences.preferencia_voo),
      timeWindow: localizeEnum(locale, preferences.horarios_voo),
      baggage: localizeEnum(locale, preferences.bagagem),
    },
    milesAndBudget: {
      milesPrograms: preferences.programas_milhas || (isPt ? 'Nao informado' : 'Not provided'),
      bankPrograms: preferences.programas_bancos || (isPt ? 'Nao informado' : 'Not provided'),
      budgetPerPersonBRL: preferences.orcamento_brl || (isPt ? 'Nao informado' : 'Not provided'),
    },
    profile: {
      travelerProfile: preferences.perfil || (isPt ? 'Nao informado' : 'Not provided'),
      hotelStandard: preferences.hospedagem_padrao,
      preferredAreas: preferences.bairros_pref || (isPt ? 'Nao informado' : 'Not provided'),
      constraints: preferences.restricoes || (isPt ? 'Nao informado' : 'Not provided'),
      climateRiskTolerance: localizeEnum(locale, preferences.tolerancia_risco),
      visasOrDocuments: preferences.vistos_existentes || (isPt ? 'Nao informado' : 'Not provided'),
    },
  };

  return JSON.stringify(context, null, 2);
}

function buildSystemPrompt(locale: Locale): string {
  if (locale === 'pt-BR') {
    return [
      'Voce e um estrategista senior de emissoes com milhas para viagens de lazer e negocio.',
      'Gere um plano objetivo, pratico e executavel em portugues do Brasil.',
      'Regras obrigatorias:',
      '- Nao invente disponibilidade real, tarifas exatas ou regras especificas de companhias sem fonte.',
      '- Sempre explicite trade-offs entre custo em milhas, tempo, conforto e risco.',
      '- Em caso de dados faltantes, registre em assumptions de forma curta e acionavel.',
      '- Priorize clareza operacional: o usuario deve saber o que fazer depois de ler o relatorio.',
      '- Evite jargoes desnecessarios, frases vagas e marketing.',
    ].join('\n');
  }

  return [
    'You are a senior miles redemption strategist for domestic and international trips.',
    'Produce a practical and execution-ready plan in English.',
    'Hard constraints:',
    '- Do not invent real-time availability, exact prices, or carrier-specific rules without sources.',
    '- Explicitly highlight trade-offs between miles cost, travel time, comfort, and risk.',
    '- If information is missing, capture it in assumptions with actionable wording.',
    '- Keep recommendations operational and concise.',
    '- Avoid buzzwords and generic filler.',
  ].join('\n');
}

function buildUserPrompt(locale: Locale, preferences: TravelPreferencesInput): string {
  const context = formatPromptContext(locale, preferences);
  if (locale === 'pt-BR') {
    return [
      'Gere o relatorio estruturado com 4 a 8 secoes.',
      'Secoes sugeridas: Resumo da Viagem, Estrategia de Emissao, Ordem de Busca e Execucao, Riscos e Mitigacao, Proximos Passos.',
      'Cada secao precisa ter 2 a 6 itens curtos e especificos.',
      'Dados do usuario (JSON):',
      context,
    ].join('\n\n');
  }

  return [
    'Generate the structured report with 4 to 8 sections.',
    'Suggested sections: Trip Summary, Redemption Strategy, Search and Execution Order, Risks and Mitigations, Next Steps.',
    'Each section must have 2 to 6 concise and specific items.',
    'User data (JSON):',
    context,
  ].join('\n\n');
}

export type GeneratePlannerReportInput = {
  locale: Locale;
  preferences: TravelPreferencesInput;
};

export type PlannerGenerationMode = 'ai' | 'fallback';

export type GeneratePlannerReportResult = {
  report: PlannerReport;
  mode: PlannerGenerationMode;
};

function buildFallbackReport({
  locale,
  preferences,
  reason,
}: GeneratePlannerReportInput & { reason?: 'missing_api_key' | 'provider_failure' }): PlannerReport {
  const isPt = locale === 'pt-BR';
  const totalPassengers = preferences.num_adultos + preferences.num_chd + preferences.num_inf;
  const assumptions: string[] = [];

  if (!preferences.programas_milhas.trim()) {
    assumptions.push(
      isPt
        ? 'Programas de milhas nao informados; priorize programas com melhor taxa de transferencia.'
        : 'Miles programs not provided; prioritize programs with stronger transfer rates.'
    );
  }
  if (!preferences.orcamento_brl.trim()) {
    assumptions.push(
      isPt
        ? 'Orcamento nao informado; defina teto por pessoa antes da emissao.'
        : 'Budget not provided; define a per-passenger cap before booking.'
    );
  }
  if (!preferences.vistos_existentes.trim()) {
    assumptions.push(
      isPt
        ? 'Documentacao nao informada; valide vistos e requisitos sanitarios antes de emitir.'
        : 'Documentation not provided; validate visas and entry requirements before issuing tickets.'
    );
  }
  assumptions.push(
    isPt
      ? 'Plano gerado em modo resiliente (fallback) por indisponibilidade temporaria da IA.'
      : 'Plan generated in resilient fallback mode due to temporary AI unavailability.'
  );
  if (reason === 'missing_api_key') {
    assumptions.push(
      isPt
        ? 'Configure GOOGLE_GENERATIVE_AI_API_KEY para habilitar analise IA completa.'
        : 'Set GOOGLE_GENERATIVE_AI_API_KEY to enable full AI analysis.'
    );
  }

  const report: PlannerReport = {
    title: isPt ? 'Plano Estrategico de Emissao' : 'Strategic Redemption Plan',
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
        title: isPt ? 'Estrategia de emissao' : 'Redemption strategy',
        items: [
          isPt
            ? '1) Busque primeiro rotas com melhor combinacao de milhas + taxas; 2) compare com tarifa pagante; 3) emita no melhor valor liquido.'
            : '1) Search routes with best miles+fees first; 2) compare against cash fares; 3) issue on best net value.',
          isPt
            ? `Preferencia de voo: ${localizeEnum(locale, preferences.preferencia_voo)}; horarios: ${localizeEnum(locale, preferences.horarios_voo)}.`
            : `Flight preference: ${localizeEnum(locale, preferences.preferencia_voo)}; time window: ${localizeEnum(locale, preferences.horarios_voo)}.`,
        ],
      },
      {
        title: isPt ? 'Ordem de execucao' : 'Execution order',
        items: [
          isPt
            ? 'Congele datas alternativas antes da busca para evitar dispersao.'
            : 'Freeze alternative dates before searching to avoid noisy comparisons.',
          isPt
            ? 'Valide bagagem e regras de conexao antes de confirmar emissao.'
            : 'Validate baggage and connection constraints before confirming booking.',
        ],
      },
      {
        title: isPt ? 'Riscos e mitigacoes' : 'Risks and mitigations',
        items: [
          isPt
            ? `Risco climatico (${localizeEnum(locale, preferences.tolerancia_risco)}): mantenha plano B em aeroporto alternativo.`
            : `Climate risk (${localizeEnum(locale, preferences.tolerancia_risco)}): keep a plan B with alternate airport options.`,
          isPt
            ? 'Nao emita ida e volta em bilhetes separados sem checar politica de alteracao.'
            : 'Do not issue outbound/return on separate tickets without checking change policies.',
        ],
      },
      {
        title: isPt ? 'Proximos passos imediatos' : 'Immediate next steps',
        items: [
          isPt
            ? 'Defina limite de custo total (milhas + taxas) por passageiro.'
            : 'Define max total cost (miles + fees) per traveler.',
          isPt
            ? 'Execute busca em 2 janelas (data alvo e +/- flexibilidade) e selecione a melhor opcao.'
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
        ? 'Nao foi possivel gerar analise detalhada. Revise os campos obrigatorios e tente novamente.'
        : 'Detailed analysis could not be generated. Review required fields and try again.',
      FALLBACK_ASSUMPTION_TOKEN,
    ];
    return {
      title: isPt ? 'Plano Basico de Viagem' : 'Basic Travel Plan',
      summary: isPt
        ? `Planejamento basico para ${totalPassengers} passageiro(s).`
        : `Basic planning for ${totalPassengers} traveler(s).`,
      sections: [
        {
          title: isPt ? 'Acoes sugeridas' : 'Suggested actions',
          items: [
            isPt ? 'Revise origem, destino e datas antes de emitir.' : 'Review origin, destination, and dates before issuing.',
            isPt ? 'Compare milhas versus tarifa em dinheiro.' : 'Compare miles versus cash fares.',
          ],
        },
        {
          title: isPt ? 'Risco' : 'Risk',
          items: [
            isPt
              ? 'A indisponibilidade temporaria da IA reduz a profundidade da analise.'
              : 'Temporary AI unavailability reduces analysis depth.',
            isPt ? 'Use verificacao manual antes da compra.' : 'Use manual verification before booking.',
          ],
        },
        {
          title: isPt ? 'Prioridade' : 'Priority',
          items: [
            isPt ? 'Defina teto de custo por pessoa.' : 'Set per-passenger cost cap.',
            isPt ? 'Confirme regras de bagagem e conexao.' : 'Confirm baggage and connection rules.',
          ],
        },
        {
          title: isPt ? 'Proximo passo' : 'Next step',
          items: [
            isPt ? 'Tente novamente em alguns minutos.' : 'Retry in a few minutes.',
            isPt ? 'Persistindo, acione suporte tecnico.' : 'If persistent, contact technical support.',
          ],
        },
      ],
      assumptions: emergencyAssumptions,
    };
  }

  return parsed.data;
}

export async function generatePlannerReport({
  locale,
  preferences,
}: GeneratePlannerReportInput): Promise<GeneratePlannerReportResult> {
  const apiKey = resolvePlannerApiKey();
  if (!apiKey) {
    return {
      mode: 'fallback',
      report: buildFallbackReport({ locale, preferences, reason: 'missing_api_key' }),
    };
  }

  const modelId = resolvePlannerModelId();
  const google = createGoogleGenerativeAI({ apiKey });

  try {
    const result = await generateText({
      model: google(modelId),
      temperature: 0.2,
      maxOutputTokens: 1800,
      output: Output.object({
        schema: plannerReportSchema,
        name: locale === 'pt-BR' ? 'relatorio_planejamento_milhas' : 'miles_planning_report',
      }),
      system: buildSystemPrompt(locale),
      prompt: buildUserPrompt(locale, preferences),
    });

    const parsed = plannerReportSchema.safeParse(result.output);
    if (!parsed.success) {
      return {
        mode: 'fallback',
        report: buildFallbackReport({ locale, preferences, reason: 'provider_failure' }),
      };
    }

    return {
      mode: 'ai',
      report: parsed.data,
    };
  } catch (error) {
    void error;
    return {
      mode: 'fallback',
      report: buildFallbackReport({ locale, preferences, reason: 'provider_failure' }),
    };
  }
}
