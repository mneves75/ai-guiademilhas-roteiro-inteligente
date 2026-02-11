import { z } from 'zod';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const boundedText = (max: number) => z.string().trim().max(max);

export const travelPreferencesSchema = z
  .object({
    data_ida: z.string().trim().regex(isoDatePattern, 'Invalid departure date'),
    data_volta: z.string().trim().regex(isoDatePattern, 'Invalid return date'),
    flex_dias: z
      .string()
      .trim()
      .regex(/^\d{1,2}$/, 'Invalid flexibility days')
      .refine((value) => Number(value) <= 30, 'Invalid flexibility days'),
    origens: z.string().trim().min(2).max(200),
    destinos: z.string().trim().min(2).max(200),
    num_adultos: z.coerce.number().int().min(1).max(9),
    num_chd: z.coerce.number().int().min(0).max(9),
    num_inf: z.coerce.number().int().min(0).max(9),
    idades_chd_inf: boundedText(120),
    preferencia_voo: z.enum(['direto', '1_conexao', 'indiferente']),
    horarios_voo: z.enum(['qualquer', 'manha', 'tarde', 'noite', 'madrugada', 'evitar_madrugada']),
    bagagem: z.enum(['mao', '1_despachada', 'mais_despachadas']),
    programas_milhas: boundedText(240),
    programas_bancos: boundedText(240),
    vistos_existentes: boundedText(240),
    orcamento_brl: boundedText(120),
    tolerancia_risco: z.enum(['baixa', 'media', 'alta']),
    perfil: boundedText(240),
    hospedagem_padrao: z.enum(['3', '4', '5', 'indiferente']),
    bairros_pref: boundedText(240),
    restricoes: boundedText(800),
  })
  .strict();

export const plannerGenerateRequestSchema = z
  .object({
    locale: z.string().optional(),
    preferences: travelPreferencesSchema,
  })
  .strict();

const reportItemSchema = z.string().trim().min(6).max(240);

const reportSectionSchema = z
  .object({
    title: z.string().trim().min(4).max(120),
    items: z.array(reportItemSchema).min(2).max(6),
  })
  .strict();

export const plannerReportSchema = z
  .object({
    title: z.string().trim().min(6).max(120),
    summary: z.string().trim().min(20).max(360),
    sections: z.array(reportSectionSchema).min(4).max(8),
    assumptions: z.array(z.string().trim().min(6).max(180)).max(10).default([]),
  })
  .strict();

export type PlannerGenerateRequest = z.infer<typeof plannerGenerateRequestSchema>;
export type TravelPreferencesInput = z.infer<typeof travelPreferencesSchema>;
