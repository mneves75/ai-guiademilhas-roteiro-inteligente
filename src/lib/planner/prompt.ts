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
        '- Cada item pode ser uma string simples OU um objeto estruturado com campos: text (obrigatorio), tag (tip/warning/action/info), links (array de {label, url, type}).',
        '- Use items estruturados quando for util: dicas praticas (tag: tip), alertas (tag: warning), acoes executaveis com link (tag: action).',
        '- Nao force items estruturados — use string simples quando nao houver valor agregado.',
        '',
        'SECAO DESTINO:',
        '- Se o usuario informou destinos candidatos, inclua uma secao "Guia Rapido: [Destino]" no final do relatorio.',
        '- Conteudo: transporte do aeroporto ao centro, bairros recomendados para o perfil do viajante, culinaria local imperdivel, dicas praticas, cuidados.',
        '- Seja especifico: nomes de linhas de metro/onibus, precos aproximados, nomes de restaurantes/bairros reais.',
        '- Se multiplos destinos, faca uma secao para cada (max 2).',
        '- Se nenhum destino informado, nao inclua esta secao.',
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
      'Se destinos candidatos foram informados, inclua secao "Guia Rapido: [Destino]" com info pratica (transporte, bairros, culinaria, dicas).',
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
