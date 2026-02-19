/**
 * Centralized text normalization and shared string constants
 * for the planner domain.
 */

import type { Locale } from '@/lib/locale';

/** Strip diacritics for accent-insensitive comparison. */
export function normalizeForComparison(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Ordered section titles for streaming progressive rendering. */
export function sectionOrder(locale: Locale): string[] {
  if (locale === 'pt-BR') {
    return [
      'Resumo da Viagem',
      'Análise de Rotas',
      'Estratégia de Milhas',
      'Hospedagem',
      'Riscos e Mitigações',
      'Próximos Passos',
      'Guia Rápido do Destino',
    ];
  }

  return [
    'Trip Summary',
    'Route Analysis',
    'Miles Strategy',
    'Lodging',
    'Risks and Mitigations',
    'Next Steps',
    'Quick Destination Guide',
  ];
}
