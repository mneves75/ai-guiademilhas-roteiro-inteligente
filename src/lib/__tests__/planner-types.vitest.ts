import { describe, expect, it } from 'vitest';
import { getItemText, isStructuredItem } from '@/lib/planner/types';
import { plannerReportSchema } from '@/lib/planner/schema';

// Extract sub-schemas for unit testing
const reportItemSchema = plannerReportSchema.shape.sections.element.shape.items.element;

// ---------------------------------------------------------------------------
// getItemText()
// ---------------------------------------------------------------------------
describe('getItemText', () => {
  it('returns the string itself for plain string items', () => {
    expect(getItemText('Buscar disponibilidade no Smiles')).toBe(
      'Buscar disponibilidade no Smiles'
    );
  });

  it('returns .text for StructuredItem objects', () => {
    expect(getItemText({ text: 'Emitir passagem pela Livelo' })).toBe(
      'Emitir passagem pela Livelo'
    );
  });
});

// ---------------------------------------------------------------------------
// isStructuredItem()
// ---------------------------------------------------------------------------
describe('isStructuredItem', () => {
  it('returns false for plain strings', () => {
    expect(isStructuredItem('plain text item')).toBe(false);
  });

  it('returns true for objects with text property', () => {
    expect(isStructuredItem({ text: 'structured item' })).toBe(true);
  });

  it('returns false for null and undefined', () => {
    expect(isStructuredItem(null as unknown as string)).toBe(false);
    expect(isStructuredItem(undefined as unknown as string)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// reportItemSchema (Zod union: string | StructuredItem)
// ---------------------------------------------------------------------------
describe('reportItemSchema', () => {
  it('accepts a valid string (>= 6 chars)', () => {
    const result = reportItemSchema.safeParse('Rotas priorizadas por custo');
    expect(result.success).toBe(true);
  });

  it('rejects a string shorter than 6 chars', () => {
    const result = reportItemSchema.safeParse('abc');
    expect(result.success).toBe(false);
  });

  it('accepts a complete StructuredItem with tag and links', () => {
    const item = {
      text: 'Buscar voos GRU-LIS no Smiles',
      tag: 'action',
      links: [
        { label: 'Smiles', url: 'https://smiles.com.br', type: 'search' },
        { label: 'Google Flights', url: 'https://flights.google.com', type: 'search' },
      ],
    };
    const result = reportItemSchema.safeParse(item);
    expect(result.success).toBe(true);
  });

  it('rejects StructuredItem with invalid tag value', () => {
    const item = { text: 'Item com tag invalida', tag: 'critical' };
    const result = reportItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it('rejects StructuredItem with more than 3 links', () => {
    const item = {
      text: 'Item com links demais no objeto',
      tag: 'info',
      links: [
        { label: 'Link 1', url: 'https://a.com', type: 'info' },
        { label: 'Link 2', url: 'https://b.com', type: 'info' },
        { label: 'Link 3', url: 'https://c.com', type: 'info' },
        { label: 'Link 4', url: 'https://d.com', type: 'info' },
      ],
    };
    const result = reportItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// plannerReportSchema — backward compatibility
// ---------------------------------------------------------------------------
describe('plannerReportSchema backward compat', () => {
  const baseReport = {
    title: 'Plano de emissao GRU-LIS',
    summary: 'Resumo com priorizacao de rotas e estrategia de emissao via milhas aereas.',
    assumptions: ['Sem disponibilidade em tempo real'],
  };

  const stringSection = (title: string) => ({
    title,
    items: ['Rotas priorizadas por custo', 'Datas definidas com flexibilidade'],
  });

  it('accepts a report with only string items (legacy format)', () => {
    const report = {
      ...baseReport,
      sections: [
        stringSection('Resumo da Viagem'),
        stringSection('Analise de Rotas'),
        stringSection('Estrategia de Milhas'),
        stringSection('Proximos Passos'),
      ],
    };
    expect(plannerReportSchema.safeParse(report).success).toBe(true);
  });

  it('accepts a report with mixed string and StructuredItem items', () => {
    const report = {
      ...baseReport,
      sections: [
        stringSection('Resumo da Viagem'),
        {
          title: 'Analise de Rotas',
          items: [
            'Rota direta GRU-LIS disponivel',
            { text: 'Buscar no Smiles ate 48h antes', tag: 'action' as const },
          ],
        },
        stringSection('Estrategia de Milhas'),
        stringSection('Proximos Passos'),
      ],
    };
    expect(plannerReportSchema.safeParse(report).success).toBe(true);
  });

  it('accepts a report with destination guide section', () => {
    const report = {
      ...baseReport,
      sections: [
        stringSection('Resumo da Viagem'),
        stringSection('Analise de Rotas'),
        stringSection('Estrategia de Milhas'),
        stringSection('Proximos Passos'),
        stringSection('Guia Rapido: Lisboa'),
      ],
    };
    expect(plannerReportSchema.safeParse(report).success).toBe(true);
  });

  it('rejects a report with fewer than 4 sections', () => {
    const report = {
      ...baseReport,
      sections: [
        stringSection('Resumo da Viagem'),
        stringSection('Analise de Rotas'),
        stringSection('Estrategia de Milhas'),
      ],
    };
    expect(plannerReportSchema.safeParse(report).success).toBe(false);
  });
});
