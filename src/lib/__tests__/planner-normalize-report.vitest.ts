import { describe, expect, it } from 'vitest';
import { initialTravelPreferences } from '@/lib/planner/constants';
import { buildFallbackReport } from '@/lib/planner/generate-report';
import {
  extractPlannerCandidateFromError,
  normalizePlannerReportCandidate,
} from '@/lib/planner/normalize-report';

function baselineReport() {
  const report = buildFallbackReport({
    locale: 'pt-BR',
    preferences: {
      ...initialTravelPreferences,
      data_ida: '2026-09-10',
      data_volta: '2026-09-20',
      origens: 'GRU',
      destinos: 'LIS, MAD',
      num_adultos: 2,
    },
    reason: 'provider_failure',
  });

  return {
    ...report,
    assumptions: [],
  };
}

describe('normalizePlannerReportCandidate', () => {
  it('normalizes section-key payload returned by local models', () => {
    const candidate = {
      'Resumo da Viagem': [
        'Viagem de 10 dias entre GRU e LIS/MAD.',
        'Perfil do viajante: casal com foco gastronomico.',
      ],
      Estrategia_de_Emissao: [
        {
          text: 'Priorize voos diretos com menor custo de milhas.',
          tag: 'tip',
          links: [{ label: 'Buscar voos', url: 'https://www.smiles.com.br', type: 'website' }],
        },
        'Compare a emissao com tarifa pagante antes de fechar.',
      ],
      Riscos_e_Mitigacao: [
        { text: 'Risco de indisponibilidade em datas fixas.', tag: 'warning' },
        { text: 'Mitigacao: manter janela flexivel de 3 dias.', tag: 'tip' },
      ],
      Proximos_Passos: [
        'Executar busca em Smiles e Latam Pass.',
        'Selecionar melhor opcao liquida por passageiro.',
      ],
      assumptions: ['Disponibilidade sujeita a alteracoes sem aviso previo.'],
    };

    const normalized = normalizePlannerReportCandidate({
      candidate,
      locale: 'pt-BR',
      fallback: baselineReport(),
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.sections.length).toBeGreaterThanOrEqual(4);
    expect(normalized?.sections[0]?.items.length).toBeGreaterThanOrEqual(2);

    const structured = normalized?.sections
      .flatMap((section) => section.items)
      .find((item) => typeof item === 'object' && item !== null && 'links' in item);

    expect(structured && typeof structured !== 'string' ? structured.links?.[0]?.type : null).toBe(
      'info'
    );
  });

  it('extracts and normalizes embedded JSON when model adds text around payload', () => {
    const embeddedJson = JSON.stringify({
      title: 'Plano Estrategico de Emissao',
      summary:
        'Plano detalhado para emissao com foco em custo total e disponibilidade de assentos em janelas alternativas.',
      sections: [
        {
          title: 'Resumo da Viagem',
          items: ['Janela de busca de 10 dias.', 'Perfil: familia com foco em conforto.'],
        },
        {
          title: 'Estrategia de Emissao',
          items: ['Priorizar voos diretos.', 'Comparar miles + cash com tarifa pagante.'],
        },
        {
          title: 'Riscos e Mitigacoes',
          items: ['Risco de indisponibilidade.', 'Mitigacao: ampliar janela em 3 dias.'],
        },
        {
          title: 'Proximos Passos',
          items: ['Executar busca agora.', 'Emitir melhor opcao liquida ainda hoje.'],
        },
      ],
      assumptions: ['Dados sujeitos a alteracoes sem aviso.'],
    });

    const candidate = `Segue o resultado solicitado:\n${embeddedJson}\nFim do relatorio.`;

    const normalized = normalizePlannerReportCandidate({
      candidate,
      locale: 'pt-BR',
      fallback: baselineReport(),
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.title).toBe('Plano Estrategico de Emissao');
    expect(normalized?.sections.length).toBeGreaterThanOrEqual(4);
  });

  it('normalizes plain-text model output into valid structured report', () => {
    const candidate =
      'Plano recomendado para emissão com foco em custo-benefício e disponibilidade. ' +
      'Priorize busca em janela de datas flexível para aumentar chance de assento. ' +
      'Compare sempre milhas mais taxas contra tarifa em dinheiro para decidir melhor opção. ' +
      'Valide regras de bagagem e conexões antes de concluir a emissão. ' +
      'Defina teto por passageiro e execute a busca por blocos de datas.';

    const normalized = normalizePlannerReportCandidate({
      candidate,
      locale: 'pt-BR',
      fallback: baselineReport(),
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.summary.length).toBeGreaterThanOrEqual(20);
    expect(normalized?.sections.length).toBeGreaterThanOrEqual(4);
    expect(normalized?.sections[0]?.items.length).toBeGreaterThanOrEqual(2);
  });
});

describe('extractPlannerCandidateFromError', () => {
  it('extracts candidate from AI error cause value', () => {
    const candidate = { title: 'X' };
    const error = {
      name: 'AI_NoObjectGeneratedError',
      cause: {
        value: candidate,
      },
    };

    expect(extractPlannerCandidateFromError(error)).toEqual(candidate);
  });
});
