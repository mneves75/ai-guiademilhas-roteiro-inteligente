export type PreferenciaVoo = 'direto' | '1_conexao' | 'indiferente';
export type Bagagem = 'mao' | '1_despachada' | 'mais_despachadas';
export type ToleranciaRisco = 'baixa' | 'media' | 'alta';
export type HospedagemPadrao = '3' | '4' | '5' | 'indiferente';
export type HorariosVoo =
  | 'qualquer'
  | 'manha'
  | 'tarde'
  | 'noite'
  | 'madrugada'
  | 'evitar_madrugada';

export interface TravelPreferences {
  data_ida: string;
  data_volta: string;
  flex_dias: string;
  origens: string;
  destinos: string;
  num_adultos: number;
  num_chd: number;
  num_inf: number;
  idades_chd_inf: string;
  preferencia_voo: PreferenciaVoo;
  horarios_voo: HorariosVoo;
  bagagem: Bagagem;
  programas_milhas: string;
  programas_bancos: string;
  vistos_existentes: string;
  orcamento_brl: string;
  tolerancia_risco: ToleranciaRisco;
  perfil: string;
  hospedagem_padrao: HospedagemPadrao;
  bairros_pref: string;
  restricoes: string;
}

// Action link for structured items
export interface ActionLink {
  label: string;
  url: string;
  type: 'search' | 'book' | 'info' | 'map';
}

// Rich item with optional metadata
export interface StructuredItem {
  text: string;
  tag?: 'tip' | 'warning' | 'action' | 'info';
  links?: ActionLink[];
}

// Backward-compatible union: plain string OR structured object
export type ReportItem = string | StructuredItem;

// Extract text from any ReportItem
export function getItemText(item: ReportItem): string {
  return typeof item === 'string' ? item : item.text;
}

// Type guard for structured items
export function isStructuredItem(item: ReportItem): item is StructuredItem {
  return item != null && typeof item !== 'string' && typeof item === 'object' && 'text' in item;
}

export interface ReportSection {
  title: string;
  items: ReportItem[];
}

export interface PlannerReport {
  title: string;
  summary: string;
  sections: ReportSection[];
  assumptions: string[];
}

// --- Tipos para streaming ---

export type PlannerStreamEvent =
  | { type: 'delta'; title?: string; summary?: string; sections: ReportSection[] }
  | { type: 'complete'; report: PlannerReport; mode: 'ai' | 'fallback'; planId?: string }
  | { type: 'error'; code: string; message: string };
