import 'server-only';

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, Output } from 'ai';
import type { Locale } from '@/lib/locale';
import { plannerReportSchema, type TravelPreferencesInput } from './schema';

const DEFAULT_PLANNER_MODEL = 'gemini-2.5-flash';

// --- Helpers para resolucao de API key e model ID ---

export function resolvePlannerApiKey(): string | null {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
  const trimmed = key?.trim();
  return trimmed ? trimmed : null;
}

function resolvePlannerModelId(): string {
  const configured = process.env.PLANNER_GOOGLE_MODEL?.trim();
  return configured || DEFAULT_PLANNER_MODEL;
}

// --- Localizacao de enums ---

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

// --- Formatacao do contexto do usuario para o prompt ---

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

// --- System prompt melhorado com ordem especifica de secoes ---

function buildSystemPrompt(locale: Locale): string {
  if (locale === 'pt-BR') {
    return [
      'Voce e um estrategista senior de emissoes com milhas aereas.',
      'Gere um plano estruturado, pratico e executavel.',
      '',
      'REGRAS:',
      '- Nao invente disponibilidade real, tarifas exatas ou regras de companhias sem fonte.',
      '- Explicite trade-offs entre custo em milhas, tempo, conforto e risco.',
      '- Dados faltantes devem ser registrados em assumptions de forma curta e acionavel.',
      '- Priorize clareza operacional: o usuario deve saber o que fazer apos ler.',
      '',
      'ORDEM DAS SECOES (gere nesta sequencia para renderizacao progressiva):',
      '1. Resumo da Viagem — visao geral do planejamento',
      '2. Analise de Rotas — opcoes de rota, conexoes, trade-offs',
      '3. Estrategia de Milhas — programas, transferencias, custo estimado',
      '4. Hospedagem — recomendacoes de area e categoria',
      '5. Riscos e Mitigacoes — riscos climaticos, documentais, operacionais',
      '6. Proximos Passos — acoes imediatas e concretas',
    ].join('\n');
  }

  return [
    'You are a senior miles redemption strategist for air travel.',
    'Generate a structured, practical, and execution-ready plan.',
    '',
    'RULES:',
    '- Do not invent real availability, exact prices, or carrier rules without sources.',
    '- Explicitly highlight trade-offs between miles cost, time, comfort, and risk.',
    '- Missing data should be recorded in assumptions with actionable wording.',
    '- Prioritize operational clarity: the user must know what to do after reading.',
    '',
    'SECTION ORDER (generate in this sequence for progressive rendering):',
    '1. Trip Summary — overall planning overview',
    '2. Route Analysis — route options, connections, trade-offs',
    '3. Miles Strategy — programs, transfers, estimated cost',
    '4. Lodging — area and category recommendations',
    '5. Risks and Mitigations — climate, documentation, operational risks',
    '6. Next Steps — immediate and concrete actions',
  ].join('\n');
}

// --- User prompt ---

function buildUserPrompt(locale: Locale, preferences: TravelPreferencesInput): string {
  const context = formatPromptContext(locale, preferences);
  if (locale === 'pt-BR') {
    return [
      'Gere o relatorio estruturado com 4 a 8 secoes.',
      'Cada secao precisa ter 2 a 6 itens curtos e especificos.',
      'Dados do usuario (JSON):',
      context,
    ].join('\n\n');
  }

  return [
    'Generate the structured report with 4 to 8 sections.',
    'Each section must have 2 to 6 concise and specific items.',
    'User data (JSON):',
    context,
  ].join('\n\n');
}

// --- Funcao principal de streaming ---

export type StreamPlannerReportInput = {
  locale: Locale;
  preferences: TravelPreferencesInput;
};

export function streamPlannerReport({ locale, preferences }: StreamPlannerReportInput) {
  const apiKey = resolvePlannerApiKey();
  if (!apiKey) {
    throw new Error('PLANNER_API_KEY_MISSING');
  }

  const modelId = resolvePlannerModelId();
  const google = createGoogleGenerativeAI({ apiKey });

  return streamText({
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
}
