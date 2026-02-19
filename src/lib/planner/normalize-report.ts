import type { Locale } from '@/lib/locale';
import type { PlannerReport, ReportItem, StructuredItem } from './types';
import { plannerReportSchema } from './schema';
import { normalizeForComparison } from './strings';

type UnknownRecord = Record<string, unknown>;

const ITEM_TAG_MAP: Record<string, StructuredItem['tag']> = {
  tip: 'tip',
  dica: 'tip',
  warning: 'warning',
  alerta: 'warning',
  cuidado: 'warning',
  action: 'action',
  acao: 'action',
  ação: 'action',
  info: 'info',
  information: 'info',
  informacao: 'info',
  informação: 'info',
};

const LINK_TYPE_MAP: Record<string, 'search' | 'book' | 'info' | 'map'> = {
  search: 'search',
  buscar: 'search',
  book: 'book',
  booking: 'book',
  info: 'info',
  information: 'info',
  website: 'info',
  web: 'info',
  site: 'info',
  url: 'info',
  map: 'map',
  maps: 'map',
  mapa: 'map',
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().replace(/\s+/g, ' ');
  return cleaned.length > 0 ? cleaned : null;
}

function toTitleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeSectionTitle(raw: string): string {
  const cleaned = raw
    .replace(/^#+\s*/g, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const lowered = normalizeForComparison(cleaned);

  if (lowered.startsWith('guia rapido')) {
    const rest = cleaned.replace(/^guia\s*r[aá]pido[:\s-]*/i, '').trim();
    return rest ? `Guia Rápido: ${rest}` : 'Guia Rápido';
  }

  if (lowered.startsWith('quick guide')) {
    const rest = cleaned.replace(/^quick\s*guide[:\s-]*/i, '').trim();
    return rest ? `Quick Guide: ${rest}` : 'Quick Guide';
  }

  if (!cleaned) return 'Seção';
  return toTitleCase(cleaned);
}

function sanitizeItemText(value: string): string | null {
  const cleaned = value.trim().replace(/\s+/g, ' ');
  if (cleaned.length < 6) return null;
  return cleaned.slice(0, 240);
}

function normalizeTag(value: unknown): StructuredItem['tag'] | undefined {
  const text = toText(value)?.toLowerCase();
  if (!text) return undefined;
  return ITEM_TAG_MAP[text];
}

function normalizeLinkType(value: unknown): 'search' | 'book' | 'info' | 'map' {
  const text = toText(value)?.toLowerCase();
  if (!text) return 'info';
  return LINK_TYPE_MAP[text] ?? 'info';
}

function normalizeLinks(value: unknown): StructuredItem['links'] | undefined {
  if (!Array.isArray(value)) return undefined;

  const normalized = value
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const label = toText(entry.label);
      const url = toText(entry.url);
      if (!label || !url) return null;

      try {
        new URL(url);
      } catch {
        return null;
      }

      return {
        label: label.slice(0, 60),
        url: url.slice(0, 500),
        type: normalizeLinkType(entry.type),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .slice(0, 3);

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeItem(value: unknown): ReportItem | null {
  if (typeof value === 'string') {
    const text = sanitizeItemText(value);
    return text ?? null;
  }

  if (!isRecord(value)) return null;

  const text =
    sanitizeItemText(toText(value.text) ?? '') ??
    sanitizeItemText(toText(value.title) ?? '') ??
    sanitizeItemText(toText(value.label) ?? '');

  if (!text) return null;

  const tag = normalizeTag(value.tag);
  const links = normalizeLinks(value.links);

  if (!tag && !links) {
    return text;
  }

  return {
    text,
    tag,
    links,
  };
}

function normalizeItems(
  value: unknown,
  fallbackItems: ReportItem[]
): { items: ReportItem[]; usedFallback: boolean } {
  const normalized = Array.isArray(value)
    ? value
        .map(normalizeItem)
        .filter((item): item is ReportItem => item !== null)
        .slice(0, 6)
    : [];

  if (normalized.length >= 2) {
    return { items: normalized, usedFallback: false };
  }

  const fallback = fallbackItems.slice(0, 6);
  const padded = [...normalized];
  for (const item of fallback) {
    if (padded.length >= 2) break;
    padded.push(item);
  }

  return { items: padded.slice(0, 6), usedFallback: true };
}

function pickString(
  source: UnknownRecord,
  keys: string[],
  fallback: string,
  minLength: number,
  maxLength: number
): string {
  for (const key of keys) {
    const text = toText(source[key]);
    if (!text) continue;
    if (text.length < minLength) continue;
    return text.slice(0, maxLength);
  }
  return fallback.slice(0, maxLength);
}

function extractJsonFromText(value: string): unknown | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parseCandidate = (candidate: string): unknown | null => {
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  };

  const findFirstJsonObject = (input: string): string | null => {
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < input.length; i += 1) {
      const char = input[i];
      if (!char) continue;

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{') {
        if (start === -1) start = i;
        depth += 1;
        continue;
      }

      if (char === '}') {
        if (depth === 0) continue;
        depth -= 1;
        if (depth === 0 && start !== -1) {
          return input.slice(start, i + 1);
        }
      }
    }

    return null;
  };

  const candidates: string[] = [];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  candidates.push(trimmed);

  for (const candidate of candidates) {
    const parsed = parseCandidate(candidate);
    if (parsed !== null) return parsed;

    const embeddedObject = findFirstJsonObject(candidate);
    if (!embeddedObject) continue;
    const embeddedParsed = parseCandidate(embeddedObject);
    if (embeddedParsed !== null) return embeddedParsed;
  }

  return null;
}

function normalizeAssumptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => toText(entry))
    .filter((entry): entry is string => entry !== null)
    .map((entry) => entry.slice(0, 180))
    .filter((entry) => entry.length >= 6)
    .slice(0, 10);
}

function buildRecordFromPlainText(
  text: string,
  locale: Locale,
  fallback: PlannerReport
): UnknownRecord | null {
  const normalizedText = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalizedText.length < 40) return null;

  const sentenceCandidates = normalizedText
    .split(/(?<=[.!?])\s+/)
    .map((entry) => sanitizeItemText(entry))
    .filter((entry): entry is string => entry !== null);

  const items = sentenceCandidates.slice(0, 6);
  if (items.length < 2) return null;

  const summary = normalizedText.slice(0, 360);
  if (summary.length < 20) return null;

  return {
    title: fallback.title,
    summary,
    sections: [
      {
        title: locale === 'pt-BR' ? 'Análise consolidada' : 'Consolidated analysis',
        items,
      },
    ],
  };
}

function extractSectionsFromNamedKeys(
  source: UnknownRecord,
  fallbackSections: PlannerReport['sections']
): PlannerReport['sections'] {
  const reserved = new Set([
    'title',
    'titulo',
    'summary',
    'resumo',
    'overview',
    'assumptions',
    'assuncao',
    'assuncoes',
  ]);

  const sections: PlannerReport['sections'] = [];

  for (const [key, value] of Object.entries(source)) {
    if (reserved.has(normalizeForComparison(key))) continue;
    if (!Array.isArray(value)) continue;
    if (!fallbackSections.length) continue;

    const fallbackSection =
      fallbackSections[sections.length % fallbackSections.length] ?? fallbackSections[0];
    if (!fallbackSection) continue;

    const normalized = normalizeItems(value, fallbackSection.items);
    if (normalized.items.length < 2) continue;

    sections.push({
      title: normalizeSectionTitle(key).slice(0, 120),
      items: normalized.items,
    });
  }

  return sections;
}

export function extractPlannerCandidateFromError(error: unknown): unknown | null {
  if (!isRecord(error)) return null;

  const directValue = error.value;
  if (directValue !== undefined) return directValue;

  const directText = toText(error.text);
  if (directText) {
    const parsed = extractJsonFromText(directText);
    if (parsed !== null) return parsed;
  }

  const cause = error.cause;
  if (isRecord(cause)) {
    if (cause.value !== undefined) return cause.value;

    const causeText = toText(cause.text);
    if (causeText) {
      const parsed = extractJsonFromText(causeText);
      if (parsed !== null) return parsed;
    }
  }

  return null;
}

export function normalizePlannerReportCandidate(params: {
  candidate: unknown;
  locale: Locale;
  fallback: PlannerReport;
}): PlannerReport | null {
  const { candidate, locale, fallback } = params;

  const parsedDirect = plannerReportSchema.safeParse(candidate);
  if (parsedDirect.success) {
    return parsedDirect.data;
  }

  let source: unknown = candidate;
  if (typeof source === 'string') {
    const parsedFromJson = extractJsonFromText(source);
    source =
      (isRecord(parsedFromJson) ? parsedFromJson : null) ??
      buildRecordFromPlainText(source, locale, fallback);
  }
  if (!isRecord(source)) return null;

  const title = pickString(source, ['title', 'titulo', 'título'], fallback.title, 6, 120);

  const summaryFallback =
    locale === 'pt-BR'
      ? 'Plano estruturado com base nas preferências informadas.'
      : 'Structured plan based on the provided preferences.';

  const summary = pickString(
    source,
    ['summary', 'resumo', 'overview', 'descricao', 'descrição'],
    summaryFallback,
    20,
    360
  );

  let sections: PlannerReport['sections'] = [];
  const fallbackSections =
    fallback.sections.length > 0
      ? fallback.sections
      : [
          {
            title: locale === 'pt-BR' ? 'Ações sugeridas' : 'Suggested actions',
            items:
              locale === 'pt-BR'
                ? [
                    'Revise origem, destino e datas antes de emitir.',
                    'Compare milhas versus tarifa em dinheiro.',
                  ]
                : [
                    'Review origin, destination, and dates before issuing.',
                    'Compare miles versus cash fares.',
                  ],
          },
        ];

  if (Array.isArray(source.sections)) {
    sections = source.sections
      .map((section, index) => {
        if (!isRecord(section)) return null;
        const fallbackSection =
          fallbackSections[index % fallbackSections.length] ?? fallbackSections[0];
        if (!fallbackSection) return null;
        const sectionTitle = pickString(
          section,
          ['title', 'titulo', 'título'],
          fallbackSection.title,
          4,
          120
        );
        const normalizedItems = normalizeItems(section.items, fallbackSection.items);
        if (normalizedItems.items.length < 2) return null;
        return { title: sectionTitle, items: normalizedItems.items };
      })
      .filter((section): section is NonNullable<typeof section> => section !== null)
      .slice(0, 8);
  } else {
    sections = extractSectionsFromNamedKeys(source, fallbackSections).slice(0, 8);
  }

  if (sections.length < 4) {
    for (const fallbackSection of fallbackSections) {
      if (sections.length >= 4) break;
      const exists = sections.some((section) => section.title === fallbackSection.title);
      if (exists) continue;
      sections.push(fallbackSection);
    }
  }
  sections = sections.slice(0, 8);

  const assumptions = normalizeAssumptions(
    source.assumptions ?? source.assuncoes ?? source.assunções ?? source.notes
  ).slice(0, 10);

  const normalizedCandidate: PlannerReport = {
    title,
    summary,
    sections,
    assumptions,
  };

  const parsedNormalized = plannerReportSchema.safeParse(normalizedCandidate);
  if (!parsedNormalized.success) {
    return null;
  }

  return parsedNormalized.data;
}
