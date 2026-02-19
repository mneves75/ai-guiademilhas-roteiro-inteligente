import { z } from 'zod';
import type { Locale } from '@/lib/locale';

const faqQuestionSchema = z
  .object({
    question: z.string().trim().min(8).max(200),
    answer: z.string().trim().min(16).max(1000),
  })
  .strict();

export type FaqQuestion = z.infer<typeof faqQuestionSchema>;

const faqPageJsonLdSchema = z
  .object({
    '@context': z.literal('https://schema.org'),
    '@type': z.literal('FAQPage'),
    mainEntity: z
      .array(
        z
          .object({
            '@type': z.literal('Question'),
            name: z.string().trim().min(8).max(200),
            acceptedAnswer: z
              .object({
                '@type': z.literal('Answer'),
                text: z.string().trim().min(16).max(1000),
              })
              .strict(),
          })
          .strict()
      )
      .min(3),
  })
  .strict();

export type FaqPageJsonLd = z.infer<typeof faqPageJsonLdSchema>;

export function buildFaqPageJsonLd(questions: FaqQuestion[]): FaqPageJsonLd {
  const normalized = z.array(faqQuestionSchema).min(3).parse(questions);

  const candidate = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: normalized.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return faqPageJsonLdSchema.parse(candidate);
}

const plannerServiceJsonLdSchema = z
  .object({
    '@context': z.literal('https://schema.org'),
    '@type': z.literal('Service'),
    name: z.string().trim().min(4).max(120),
    serviceType: z.string().trim().min(4).max(120),
    description: z.string().trim().min(20).max(300),
    provider: z
      .object({
        '@type': z.literal('Organization'),
        name: z.string().trim().min(2).max(120),
        url: z.string().url(),
      })
      .strict(),
    areaServed: z.literal('BR'),
    availableLanguage: z.union([z.literal('pt-BR'), z.literal('en-US')]),
    offers: z
      .object({
        '@type': z.literal('Offer'),
        url: z.string().url(),
        priceCurrency: z.literal('BRL'),
        availability: z.literal('https://schema.org/InStock'),
      })
      .strict(),
  })
  .strict();

export type PlannerServiceJsonLd = z.infer<typeof plannerServiceJsonLdSchema>;

export function buildPlannerServiceJsonLd(input: {
  appName: string;
  siteUrl: string;
  locale: Locale;
  description: string;
}): PlannerServiceJsonLd {
  const language = input.locale === 'pt-BR' ? 'pt-BR' : 'en-US';
  const name = input.locale === 'pt-BR' ? 'Planner de viagens com milhas' : 'Miles travel planner';
  const serviceType =
    input.locale === 'pt-BR' ? 'Planejamento estratégico de viagens' : 'Strategic travel planning';

  const candidate = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    serviceType,
    description: input.description,
    provider: {
      '@type': 'Organization',
      name: input.appName,
      url: input.siteUrl,
    },
    areaServed: 'BR',
    availableLanguage: language,
    offers: {
      '@type': 'Offer',
      url: `${input.siteUrl}/pricing`,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
    },
  };

  return plannerServiceJsonLdSchema.parse(candidate);
}

const pricingOfferSchema = z
  .object({
    '@type': z.literal('Offer'),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().min(4).max(240),
    priceCurrency: z.literal('BRL'),
    price: z.string().regex(/^\d+(\.\d{2})?$/),
    availability: z.literal('https://schema.org/InStock'),
    url: z.string().url(),
  })
  .strict();

const pricingOfferCatalogSchema = z
  .object({
    '@context': z.literal('https://schema.org'),
    '@type': z.literal('OfferCatalog'),
    name: z.string().trim().min(4).max(140),
    itemListElement: z.array(pricingOfferSchema).min(1),
  })
  .strict();

export type PricingOfferCatalogJsonLd = z.infer<typeof pricingOfferCatalogSchema>;

type PlanOfferInput = {
  name: string;
  description: string;
  priceMonthlyCents: number | null;
};

export function buildPricingOfferCatalogJsonLd(input: {
  locale: Locale;
  plans: PlanOfferInput[];
  signupUrl: string;
}): PricingOfferCatalogJsonLd {
  const catalogName = input.locale === 'pt-BR' ? 'Planos do Guia de Milhas' : 'Miles Guide plans';
  const offers = input.plans
    .filter((plan) => typeof plan.priceMonthlyCents === 'number')
    .map((plan) => ({
      '@type': 'Offer' as const,
      name: plan.name,
      description: plan.description,
      priceCurrency: 'BRL' as const,
      price: (plan.priceMonthlyCents! / 100).toFixed(2),
      availability: 'https://schema.org/InStock' as const,
      url: input.signupUrl,
    }));

  const candidate = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: catalogName,
    itemListElement: offers,
  };

  return pricingOfferCatalogSchema.parse(candidate);
}
