import { describe, expect, it } from 'vitest';
import {
  buildFaqPageJsonLd,
  buildPlannerServiceJsonLd,
  buildPricingOfferCatalogJsonLd,
} from '@/lib/seo/structured-data';

describe('structured data helpers', () => {
  it('builds a valid FAQPage JSON-LD payload', () => {
    const jsonLd = buildFaqPageJsonLd([
      {
        question: 'Preciso pagar para começar?',
        answer: 'Não. Você pode criar conta e começar a usar o planner imediatamente.',
      },
      {
        question: 'O planner decide por mim?',
        answer: 'Não. O planner organiza cenários e você decide com base em trade-offs claros.',
      },
      {
        question: 'Funciona para viagem internacional?',
        answer: 'Sim. O fluxo foi desenhado para viagens nacionais e internacionais.',
      },
    ]);

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('FAQPage');
    expect(jsonLd.mainEntity).toHaveLength(3);
    expect(jsonLd.mainEntity.every((item) => item['@type'] === 'Question')).toBe(true);
  });

  it('fails when faq payload has fewer than 3 entries', () => {
    expect(() =>
      buildFaqPageJsonLd([
        {
          question: 'Pergunta curta',
          answer: 'Resposta suficientemente longa para passar no limite mínimo.',
        },
        {
          question: 'Outra pergunta válida?',
          answer: 'Outra resposta válida com tamanho aceitável para o schema.',
        },
      ])
    ).toThrow();
  });

  it('builds planner service JSON-LD for pt-BR locale', () => {
    const jsonLd = buildPlannerServiceJsonLd({
      appName: 'Guia de Milhas',
      siteUrl: 'https://guiademilhas.app',
      locale: 'pt-BR',
      description: 'Planeje viagens com milhas com clareza e comparação de cenários.',
    });

    expect(jsonLd['@type']).toBe('Service');
    expect(jsonLd.availableLanguage).toBe('pt-BR');
    expect(jsonLd.offers.priceCurrency).toBe('BRL');
  });

  it('builds pricing offer catalog with numeric plans only', () => {
    const jsonLd = buildPricingOfferCatalogJsonLd({
      locale: 'en',
      signupUrl: 'https://guiademilhas.app/signup?callbackUrl=%2Fplanner',
      plans: [
        {
          name: 'Free',
          description: 'Starter plan',
          priceMonthlyCents: 0,
        },
        {
          name: 'Pro',
          description: 'Paid plan',
          priceMonthlyCents: 1900,
        },
        {
          name: 'Enterprise',
          description: 'Custom plan',
          priceMonthlyCents: null,
        },
      ],
    });

    expect(jsonLd['@type']).toBe('OfferCatalog');
    expect(jsonLd.itemListElement).toHaveLength(2);
    expect(jsonLd.itemListElement[1]?.price).toBe('19.00');
  });
});
