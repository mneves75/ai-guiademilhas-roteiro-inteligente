import { describe, expect, it } from 'vitest';
import { getLandingContent } from '@/content/landing';

describe('landing content', () => {
  it('returns pt-BR copy for Brazilian locale', () => {
    const content = getLandingContent('pt-BR');
    expect(content.appName).toBe('Guia de Milhas');
    expect(content.primaryCta).toBe('Criar meu planejamento agora');
    expect(content.finalCta).toBe('Ir para o planner');
  });

  it('falls back to english content for unknown locale values', () => {
    const content = getLandingContent('es-ES' as 'en' | 'pt-BR');
    expect(content.appName).toBe('Miles Guide');
    expect(content.primaryCta).toBe('Build my plan now');
  });
});
