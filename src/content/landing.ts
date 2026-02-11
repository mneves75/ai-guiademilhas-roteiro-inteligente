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
      'Descubra a melhor estratégia para voar gastando menos pontos e menos dinheiro. Crie seu planejamento inteligente em minutos.',
    appName: 'Guia de Milhas',
    badge: 'Planejamento com IA para milhas e passagens',
    headline: 'Pare de perder milhas em decisões erradas de viagem.',
    subheadline:
      'Responda algumas perguntas e receba um plano objetivo com rotas, alternativas e prioridades para usar melhor seus pontos.',
    primaryCta: 'Criar meu planejamento agora',
    secondaryCta: 'Já tenho conta',
    proofTitle: 'Você ganha clareza antes de emitir',
    proofPoints: [
      'Comparação prática de cenários para viajar com milhas.',
      'Priorização por custo-benefício, tempo de voo e risco climático.',
      'Relatório acionável para decidir com confiança.',
    ],
    howTitle: 'Como funciona',
    howSteps: [
      {
        title: '1. Informe seu contexto',
        description: 'Datas, origens, destinos, passageiros e seus programas de milhas.',
      },
      {
        title: '2. O planner analisa cenários',
        description: 'A IA organiza opções e evidencia trade-offs relevantes para a decisão.',
      },
      {
        title: '3. Receba seu plano',
        description: 'Você sai com um roteiro estratégico pronto para executar.',
      },
    ],
    faqTitle: 'Perguntas frequentes',
    faqs: [
      {
        question: 'Preciso pagar para testar?',
        answer:
          'Você pode criar conta e acessar o planner. A política comercial evolutiva será aplicada nas próximas fases.',
      },
      {
        question: 'O planner substitui minha decisão?',
        answer:
          'Não. Ele reduz incerteza e organiza as melhores alternativas, mas a decisão final continua sua.',
      },
      {
        question: 'Funciona para viagens nacionais e internacionais?',
        answer:
          'Sim. O fluxo foi pensado para cenários com múltiplas origens, destinos e combinações de programas.',
      },
    ],
    finalTitle: 'Se você quer decisão melhor, comece com um plano melhor.',
    finalSubtitle:
      'Entre e use o planner para transformar dados soltos em decisão estratégica de viagem.',
    finalCta: 'Ir para o planner',
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
    finalCta: 'Go to planner',
    loginCta: 'Sign in',
  },
};

export function getLandingContent(locale: 'en' | 'pt-BR'): LandingContent {
  return landingContentByLocale[locale] ?? landingContentByLocale.en;
}
