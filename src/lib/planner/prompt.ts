import 'server-only';

import type { Locale } from '@/lib/locale';
import type { TravelPreferencesInput } from './schema';

const DEFAULT_PLANNER_MODEL = 'gemini-2.5-flash';

export function resolvePlannerApiKey(): string | null {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
  const trimmed = key?.trim();
  return trimmed ? trimmed : null;
}

export function resolvePlannerModelId(): string {
  const configured = process.env.PLANNER_GOOGLE_MODEL?.trim();
  return configured || DEFAULT_PLANNER_MODEL;
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

export function buildSystemPrompt(locale: Locale, options?: { sectionOrder?: string[] }): string {
  const isPt = locale === 'pt-BR';
  const base = isPt
    ? [
        'Voce e um estrategista senior de emissoes com milhas para viagens de lazer e negocio.',
        'Gere um plano objetivo, pratico e executavel em portugues do Brasil.',
        'Regras obrigatorias:',
        '- Nao invente disponibilidade real, tarifas exatas ou regras especificas de companhias sem fonte.',
        '- Sempre explicite trade-offs entre custo em milhas, tempo, conforto e risco.',
        '- Em caso de dados faltantes, registre em assumptions de forma curta e acionavel.',
        '- Priorize clareza operacional: o usuario deve saber o que fazer depois de ler o relatorio.',
        '- Evite jargoes desnecessarios, frases vagas e marketing.',
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
      ];

  if (options?.sectionOrder?.length) {
    base.push('');
    base.push(
      isPt
        ? 'ORDEM DAS SECOES (gere nesta sequencia para renderizacao progressiva):'
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
