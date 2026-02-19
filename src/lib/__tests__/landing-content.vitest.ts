import { describe, expect, it } from 'vitest';
import { getLandingContent } from '@/content/landing';

describe('landing content', () => {
  it('returns pt-BR copy for Brazilian locale', () => {
    const content = getLandingContent('pt-BR');
    expect(content.appName).toBe('Guia de Milhas');
    expect(content.primaryCta).toBe('Criar meu planejamento agora');
    expect(content.finalCta).toBe('Criar conta e abrir o planner');
  });

  it('falls back to english content for unknown locale values', () => {
    const content = getLandingContent('es-ES' as 'en' | 'pt-BR');
    expect(content.appName).toBe('Miles Guide');
    expect(content.primaryCta).toBe('Build my plan now');
  });

  it('keeps minimum conversion + SEO invariants for both locales', () => {
    (['pt-BR', 'en'] as const).forEach((locale) => {
      const content = getLandingContent(locale);
      expect(content.metaTitle.length).toBeGreaterThanOrEqual(20);
      expect(content.metaDescription.length).toBeGreaterThanOrEqual(100);
      expect(content.howSteps.length).toBe(3);
      expect(content.faqs.length).toBeGreaterThanOrEqual(3);
      expect(content.proofPoints.length).toBeGreaterThanOrEqual(3);
      expect(content.primaryCta.trim().length).toBeGreaterThan(0);
      expect(content.finalCta.trim().length).toBeGreaterThan(0);
    });
  });
});
