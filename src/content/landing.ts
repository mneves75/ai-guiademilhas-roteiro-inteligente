export type LandingContent = {
  skipToContent: string;
  metaTitle: string;
  metaDescription: string;
  appName: string;
  badge: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  proofTitle: string;
  proofPoints: string[];
  howTitle: string;
  howSteps: { title: string; description: string }[];
  faqTitle: string;
  faqs: { question: string; answer: string }[];
  finalTitle: string;
  finalSubtitle: string;
  finalCta: string;
  loginCta: string;
};

const landingContentByLocale: Record<'en' | 'pt-BR', LandingContent> = {
  'pt-BR': {
    skipToContent: 'Pular para o conteúdo',
    metaTitle: 'Guia de Milhas | Planner Inteligente de Viagens',
    metaDescription:
      'Crie roteiros inteligentes de viagem com milhas: compare cenários, reduza custo total e escolha a melhor emissão em minutos.',
    appName: 'Guia de Milhas',
    badge: 'Roteiro inteligente para milhas e passagens',
    headline: 'Pare de desperdiçar milhas em emissões mal planejadas.',
    subheadline:
      'Em poucos minutos, o planner transforma datas, rotas e programas em um roteiro objetivo com prioridades, trade-offs e próximos passos.',
    primaryCta: 'Criar meu planejamento agora',
    secondaryCta: 'Já tenho conta',
    proofTitle: 'Decisão clara antes da emissão',
    proofPoints: [
      'Comparação prática entre rotas, custos em milhas e taxas.',
      'Priorização por valor líquido, tempo total e risco operacional.',
      'Plano acionável para emitir com menos retrabalho.',
    ],
    howTitle: 'Como funciona',
    howSteps: [
      {
        title: '1. Você informa os dados da viagem',
        description: 'Datas, origem, destinos, passageiros e programas de milhas disponíveis.',
      },
      {
        title: '2. O planner organiza os cenários',
        description:
          'A análise compara alternativas e destaca os trade-offs que realmente importam.',
      },
      {
        title: '3. Você executa com confiança',
        description: 'Receba um roteiro com direção prática para a próxima ação.',
      },
    ],
    faqTitle: 'Perguntas frequentes',
    faqs: [
      {
        question: 'Preciso pagar para testar?',
        answer: 'Não. Você pode criar conta agora e gerar seu primeiro roteiro.',
      },
      {
        question: 'O planner decide por mim?',
        answer: 'Não. Ele organiza cenários e reduz incerteza, mas a decisão final continua sua.',
      },
      {
        question: 'Funciona para viagens nacionais e internacionais?',
        answer:
          'Sim. O fluxo suporta múltiplas origens, destinos e combinações de programas de milhas.',
      },
    ],
    finalTitle: 'Quem economiza milhas com consistência começa com um bom roteiro.',
    finalSubtitle:
      'Entre agora e use o planner para sair do improviso e decidir sua viagem com mais previsibilidade.',
    finalCta: 'Criar conta e abrir o planner',
    loginCta: 'Entrar',
  },
  en: {
    skipToContent: 'Skip to content',
    metaTitle: 'Miles Guide | Smart Travel Planner',
    metaDescription:
      'Build a smarter travel plan to spend fewer points and less cash. Get a practical recommendation in minutes.',
    appName: 'Miles Guide',
    badge: 'AI planner for points and flights',
    headline: 'Stop wasting miles on poor travel decisions.',
    subheadline:
      'Answer a few questions and get a direct plan with route alternatives and clear priorities.',
    primaryCta: 'Build my plan now',
    secondaryCta: 'I already have an account',
    proofTitle: 'Get clarity before booking',
    proofPoints: [
      'Practical comparison of travel scenarios with miles.',
      'Prioritization by value, flight time, and climate risk.',
      'Actionable report for confident decisions.',
    ],
    howTitle: 'How it works',
    howSteps: [
      {
        title: '1. Share your context',
        description: 'Dates, origins, destinations, passengers, and rewards programs.',
      },
      {
        title: '2. Planner evaluates scenarios',
        description: 'AI organizes options and highlights meaningful trade-offs.',
      },
      {
        title: '3. Get your plan',
        description: 'You receive a practical strategy ready to execute.',
      },
    ],
    faqTitle: 'FAQ',
    faqs: [
      {
        question: 'Do I need to pay to try it?',
        answer:
          'You can create an account and use the planner. Commercial policy will evolve in upcoming phases.',
      },
      {
        question: 'Does the planner replace my decision?',
        answer:
          'No. It reduces uncertainty and structures alternatives, but the final decision remains yours.',
      },
      {
        question: 'Does it work for domestic and international trips?',
        answer:
          'Yes. The flow supports multiple origins, destinations, and reward-program combinations.',
      },
    ],
    finalTitle: 'Better decisions start with a better plan.',
    finalSubtitle: 'Sign in and turn scattered data into an actionable travel strategy.',
    finalCta: 'Create account and open planner',
    loginCta: 'Sign in',
  },
};

export function getLandingContent(locale: 'en' | 'pt-BR'): LandingContent {
  return landingContentByLocale[locale] ?? landingContentByLocale.en;
}
