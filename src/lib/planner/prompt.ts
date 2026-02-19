import 'server-only';

import type { Locale } from '@/lib/locale';
import type { TravelPreferencesInput } from './schema';

const DEFAULT_GOOGLE_PLANNER_MODEL = 'gemini-2.5-flash';
const DEFAULT_LM_STUDIO_MODEL = 'qwen_qwen3-next-80b-a3b-instruct';
const DEFAULT_LM_STUDIO_FALLBACK_MODEL = 'liquid/lfm2.5-1.2b';
const DEFAULT_LM_STUDIO_BASE_URL = 'http://localhost:1234/v1';

export type PlannerProvider = 'google' | 'lmstudio';

export function resolvePlannerProvider(): PlannerProvider {
  const configured = process.env.PLANNER_PROVIDER?.trim().toLowerCase();
  if (configured === 'lmstudio' || configured === 'lm-studio' || configured === 'lm_studio') {
    return 'lmstudio';
  }
  return 'google';
}

export function resolvePlannerApiKey(
  provider: PlannerProvider = resolvePlannerProvider()
): string | null {
  if (provider === 'lmstudio') {
    const key = process.env.PLANNER_LM_STUDIO_API_KEY ?? process.env.OPENAI_API_KEY ?? 'lm-studio';
    const trimmed = key?.trim();
    return trimmed || 'lm-studio';
  }

  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
  const trimmed = key?.trim();
  return trimmed ? trimmed : null;
}

export function resolvePlannerModelId(
  provider: PlannerProvider = resolvePlannerProvider()
): string {
  if (provider === 'lmstudio') {
    const configured = process.env.PLANNER_LM_STUDIO_MODEL?.trim();
    return configured || DEFAULT_LM_STUDIO_MODEL;
  }

  const configured = process.env.PLANNER_GOOGLE_MODEL?.trim();
  return configured || DEFAULT_GOOGLE_PLANNER_MODEL;
}

export function resolvePlannerFallbackModelId(
  provider: PlannerProvider = resolvePlannerProvider()
): string | null {
  if (provider !== 'lmstudio') {
    return null;
  }

  const configured = process.env.PLANNER_LM_STUDIO_FALLBACK_MODEL?.trim();
  const candidate = configured || DEFAULT_LM_STUDIO_FALLBACK_MODEL;
  return candidate || null;
}

export function resolvePlannerBaseUrl(
  provider: PlannerProvider = resolvePlannerProvider()
): string | null {
  if (provider !== 'lmstudio') {
    return null;
  }
  const configured = process.env.PLANNER_LM_STUDIO_BASE_URL?.trim();
  return configured || DEFAULT_LM_STUDIO_BASE_URL;
}

export function localizeEnum(locale: Locale, value: string): string {
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
    '1_conexao': 'até 1 conexão',
    indiferente: 'sem preferência rígida',
    qualquer: 'qualquer horário',
    manha: 'manhã',
    tarde: 'tarde',
    noite: 'noite',
    madrugada: 'madrugada',
    evitar_madrugada: 'evitar madrugada',
    mao: 'somente bagagem de mão',
    '1_despachada': '1 bagagem despachada',
    mais_despachadas: '2+ bagagens despachadas',
    baixa: 'baixa',
    media: 'média',
    alta: 'alta',
  };
  return map[value] ?? value;
}

export function formatPromptContext(locale: Locale, preferences: TravelPreferencesInput): string {
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
      agesChildrenInfants: preferences.idades_chd_inf || (isPt ? 'Não informado' : 'Not provided'),
    },
    flight: {
      preference: localizeEnum(locale, preferences.preferencia_voo),
      timeWindow: localizeEnum(locale, preferences.horarios_voo),
      baggage: localizeEnum(locale, preferences.bagagem),
    },
    milesAndBudget: {
      milesPrograms: preferences.programas_milhas || (isPt ? 'Não informado' : 'Not provided'),
      bankPrograms: preferences.programas_bancos || (isPt ? 'Não informado' : 'Not provided'),
      budgetPerPersonBRL: preferences.orcamento_brl || (isPt ? 'Não informado' : 'Not provided'),
    },
    profile: {
      travelerProfile: preferences.perfil || (isPt ? 'Não informado' : 'Not provided'),
      hotelStandard: preferences.hospedagem_padrao,
      preferredAreas: preferences.bairros_pref || (isPt ? 'Não informado' : 'Not provided'),
      constraints: preferences.restricoes || (isPt ? 'Não informado' : 'Not provided'),
      climateRiskTolerance: localizeEnum(locale, preferences.tolerancia_risco),
      visasOrDocuments: preferences.vistos_existentes || (isPt ? 'Não informado' : 'Not provided'),
    },
  };

  return JSON.stringify(context, null, 2);
}

export function buildSystemPrompt(locale: Locale, options?: { sectionOrder?: string[] }): string {
  const isPt = locale === 'pt-BR';
  const base = isPt
    ? [
        'Você é um estrategista sênior de emissões com milhas para viagens de lazer e negócio.',
        'Gere um plano objetivo, prático e executável em português do Brasil.',
        'Regras obrigatórias:',
        '- Não invente disponibilidade real, tarifas exatas ou regras específicas de companhias sem fonte.',
        '- Sempre explicite trade-offs entre custo em milhas, tempo, conforto e risco.',
        '- Em caso de dados faltantes, registre em assumptions de forma curta e acionável.',
        '- Priorize clareza operacional: o usuário deve saber o que fazer depois de ler o relatório.',
        '- Evite jargões desnecessários, frases vagas e marketing.',
        '- Cada item pode ser uma string simples OU um objeto estruturado com campos: text (obrigatório), tag (tip/warning/action/info), links (array de {label, url, type}).',
        '- Use items estruturados quando for útil: dicas práticas (tag: tip), alertas (tag: warning), ações executáveis com link (tag: action).',
        '- Não force items estruturados — use string simples quando não houver valor agregado.',
        '',
        'SEÇÃO DESTINO:',
        '- Se o usuário informou destinos candidatos, inclua uma seção "Guia Rápido: [Destino]" no final do relatório.',
        '- Conteúdo: transporte do aeroporto ao centro, bairros recomendados para o perfil do viajante, culinária local imperdível, dicas práticas, cuidados.',
        '- Seja específico: nomes de linhas de metrô/ônibus, preços aproximados, nomes de restaurantes/bairros reais.',
        '- Se múltiplos destinos, faça uma seção para cada (max 2).',
        '- Se nenhum destino informado, não inclua esta seção.',
      ]
    : [
        'You are a senior miles redemption strategist for domestic and international trips.',
        'Produce a practical and execution-ready plan in English.',
        'Hard constraints:',
        '- Do not invent real-time availability, exact prices, or carrier-specific rules without sources.',
        '- Explicitly highlight trade-offs between miles cost, travel time, comfort, and risk.',
        '- If information is missing, capture it in assumptions with actionable wording.',
        '- Keep recommendations operational and concise.',
        '- Avoid buzzwords and generic filler.',
        '- Each item can be a plain string OR a structured object with: text (required), tag (tip/warning/action/info), links (array of {label, url, type}).',
        '- Use structured items when useful: practical tips (tag: tip), warnings (tag: warning), actionable items with links (tag: action).',
        '- Do not force structured items — use plain strings when there is no added value.',
        '',
        'DESTINATION SECTION:',
        '- If the user provided candidate destinations, include a "Quick Guide: [Destination]" section at the end.',
        '- Content: airport transport to city center, recommended neighborhoods for the traveler profile, must-try local cuisine, practical tips, warnings.',
        '- Be specific: metro/bus line names, approximate prices, real restaurant/neighborhood names.',
        '- For multiple destinations, create one section per destination (max 2).',
        '- If no destination provided, skip this section.',
      ];

  if (options?.sectionOrder?.length) {
    base.push('');
    base.push(
      isPt
        ? 'ORDEM DAS SEÇÕES (gere nesta sequência para renderização progressiva):'
        : 'SECTION ORDER (generate in this sequence for progressive rendering):'
    );
    options.sectionOrder.forEach((s, i) => base.push(`${i + 1}. ${s}`));
  }

  return base.join('\n');
}

export function buildUserPrompt(locale: Locale, preferences: TravelPreferencesInput): string {
  const context = formatPromptContext(locale, preferences);
  if (locale === 'pt-BR') {
    return [
      'Gere o relatório estruturado com 4 a 8 seções.',
      'Seções sugeridas: Resumo da Viagem, Estratégia de Emissão, Ordem de Busca e Execução, Riscos e Mitigação, Próximos Passos.',
      'Cada seção precisa ter 2 a 6 itens curtos e específicos.',
      'Se destinos candidatos foram informados, inclua seção "Guia Rápido: [Destino]" com info prática (transporte, bairros, culinária, dicas).',
      'Formato dos items: string simples OU objeto { text, tag?, links?: [{label, url, type}] }.',
      'Dados do usuario (JSON):',
      context,
    ].join('\n\n');
  }

  return [
    'Generate the structured report with 4 to 8 sections.',
    'Suggested sections: Trip Summary, Redemption Strategy, Search and Execution Order, Risks and Mitigations, Next Steps.',
    'Each section must have 2 to 6 concise and specific items.',
    'If candidate destinations were provided, include a "Quick Guide: [Destination]" section with practical info (transport, neighborhoods, cuisine, tips).',
    'Item format: plain string OR object { text, tag?, links?: [{label, url, type}] }.',
    'User data (JSON):',
    context,
  ].join('\n\n');
}
