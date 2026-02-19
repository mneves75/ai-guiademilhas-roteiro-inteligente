'use client';

import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import type { TravelPreferences } from '@/lib/planner/types';
import { initialTravelPreferences } from '@/lib/planner/constants';

const STORAGE_KEY = 'planner-wizard-draft';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const boundedText = (max: number) => z.string().trim().max(max);

// Step-level schemas — extracted from the same field definitions as travelPreferencesSchema
// to allow .pick()-style per-step validation without fighting ZodEffects wrappers.
const stepSchemas = {
  0: z.object({
    data_ida: z.string().trim().regex(isoDatePattern, 'Invalid departure date'),
    data_volta: z.string().trim().regex(isoDatePattern, 'Invalid return date'),
    flex_dias: z
      .string()
      .trim()
      .regex(/^\d{1,2}$/, 'Invalid flexibility days')
      .refine((value) => Number(value) <= 30, 'Invalid flexibility days'),
    origens: z.string().trim().min(2).max(200),
    destinos: z.string().trim().min(2).max(200),
  }),
  1: z.object({
    num_adultos: z.coerce.number().int().min(1).max(9),
    num_chd: z.coerce.number().int().min(0).max(9),
    num_inf: z.coerce.number().int().min(0).max(9),
    idades_chd_inf: boundedText(120),
  }),
  2: z.object({
    preferencia_voo: z.enum(['direto', '1_conexao', 'indiferente']),
    horarios_voo: z.enum(['qualquer', 'manha', 'tarde', 'noite', 'madrugada', 'evitar_madrugada']),
    bagagem: z.enum(['mao', '1_despachada', 'mais_despachadas']),
    programas_milhas: boundedText(240),
    programas_bancos: boundedText(240),
    orcamento_brl: boundedText(120),
  }),
  3: z.object({
    tolerancia_risco: z.enum(['baixa', 'media', 'alta']),
    hospedagem_padrao: z.enum(['3', '4', '5', 'indiferente']),
    bairros_pref: boundedText(240),
    perfil: boundedText(240),
    restricoes: boundedText(800),
    vistos_existentes: boundedText(240),
  }),
} as const;

const stepFieldKeys = {
  0: ['data_ida', 'data_volta', 'flex_dias', 'origens', 'destinos'] as const,
  1: ['num_adultos', 'num_chd', 'num_inf', 'idades_chd_inf'] as const,
  2: [
    'preferencia_voo',
    'horarios_voo',
    'bagagem',
    'programas_milhas',
    'programas_bancos',
    'orcamento_brl',
  ] as const,
  3: [
    'tolerancia_risco',
    'hospedagem_padrao',
    'bairros_pref',
    'perfil',
    'restricoes',
    'vistos_existentes',
  ] as const,
} as const;

export const TOTAL_STEPS = 4;

export type StepIndex = 0 | 1 | 2 | 3;
type FieldErrors = Partial<Record<keyof TravelPreferences, string>>;

export function useWizardForm() {
  const [currentStep, setCurrentStep] = useState<StepIndex>(0);
  const [formData, setFormData] = useState<TravelPreferences>(initialTravelPreferences);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<TravelPreferences>;
        setFormData((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch {
      /* storage full, ignore */
    }
  }, [formData]);

  const updateField = useCallback(
    <K extends keyof TravelPreferences>(key: K, value: TravelPreferences[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      // Clear error for this field when user edits it
      setErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  const validateStep = useCallback(
    (step: StepIndex): boolean => {
      const fields = stepFieldKeys[step];
      const schema = stepSchemas[step];

      const stepData = Object.fromEntries(fields.map((f) => [f, formData[f]]));
      const result = schema.safeParse(stepData);

      if (result.success) {
        // Clear errors for this step's fields
        setErrors((prev) => {
          const next = { ...prev };
          for (const f of fields) delete next[f as keyof TravelPreferences];
          return next;
        });
        return true;
      }

      const newErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof TravelPreferences;
        if (!newErrors[field]) {
          newErrors[field] =
            issue.code === 'too_small' || issue.code === 'invalid_type'
              ? 'Campo obrigatório.'
              : issue.message;
        }
      }
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return false;
    },
    [formData]
  );

  const validateAll = useCallback((): boolean => {
    // Validate steps 0-2 (required) but skip step 3 (optional)
    let allValid = true;
    const allErrors: FieldErrors = {};

    for (const step of [0, 1, 2] as const) {
      const fields = stepFieldKeys[step];
      const schema = stepSchemas[step];
      const stepData = Object.fromEntries(fields.map((f) => [f, formData[f]]));
      const result = schema.safeParse(stepData);

      if (!result.success) {
        allValid = false;
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof TravelPreferences;
          if (!allErrors[field]) {
            allErrors[field] =
              issue.code === 'too_small' || issue.code === 'invalid_type'
                ? 'Campo obrigatório.'
                : issue.message;
          }
        }
      }
    }

    // Also validate date order (superRefine logic)
    if (isoDatePattern.test(formData.data_ida) && isoDatePattern.test(formData.data_volta)) {
      const departure = Date.parse(`${formData.data_ida}T00:00:00Z`);
      const returnDate = Date.parse(`${formData.data_volta}T00:00:00Z`);
      if (Number.isFinite(departure) && Number.isFinite(returnDate) && returnDate < departure) {
        allValid = false;
        allErrors.data_volta = 'A data de volta deve ser igual ou posterior à data de ida.';
      }
    }

    setErrors(allValid ? {} : allErrors);
    return allValid;
  }, [formData]);

  const goNext = useCallback(() => {
    if (currentStep < 3) {
      if (validateStep(currentStep)) {
        // Additional date order check on step 0
        if (currentStep === 0) {
          if (isoDatePattern.test(formData.data_ida) && isoDatePattern.test(formData.data_volta)) {
            const departure = Date.parse(`${formData.data_ida}T00:00:00Z`);
            const returnDate = Date.parse(`${formData.data_volta}T00:00:00Z`);
            if (
              Number.isFinite(departure) &&
              Number.isFinite(returnDate) &&
              returnDate < departure
            ) {
              setErrors((prev) => ({
                ...prev,
                data_volta: 'A data de volta deve ser igual ou posterior à data de ida.',
              }));
              return;
            }
          }
        }
        setCurrentStep((s) => (s + 1) as StepIndex);
      }
    }
  }, [currentStep, validateStep, formData.data_ida, formData.data_volta]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => (s - 1) as StepIndex);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (step: StepIndex) => {
      if (step < currentStep) {
        setCurrentStep(step);
      } else if (step > currentStep) {
        if (validateStep(currentStep)) {
          setCurrentStep(step);
        }
      }
    },
    [currentStep, validateStep]
  );

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(initialTravelPreferences);
    setCurrentStep(0);
    setErrors({});
  }, []);

  return {
    currentStep,
    formData,
    errors,
    updateField,
    validateStep,
    validateAll,
    goNext,
    goBack,
    goToStep,
    clearDraft,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === 3,
  };
}
