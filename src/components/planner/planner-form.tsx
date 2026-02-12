'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Locale } from '@/lib/locale';
import { initialTravelPreferences } from '@/lib/planner/constants';
import type { PlannerReport, TravelPreferences } from '@/lib/planner/types';
import { travelPreferencesSchema } from '@/lib/planner/schema';
import {
  parsePlannerGenerateSuccessPayload,
  parsePlannerProblemDetails,
} from '@/lib/planner/api-contract';
import { plannerFunnelEvents } from '@/lib/analytics/funnel';
import {
  capturePlannerFunnelEvent,
  clearPlannerFunnelSource,
  readPlannerFunnelSource,
} from '@/lib/analytics/funnel-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

type FieldErrors = Partial<Record<keyof TravelPreferences, string>>;

const labels = {
  'pt-BR': {
    title: 'Planner de Viagens com Milhas',
    subtitle: 'Preencha os dados da viagem e receba um plano estratégico gerado por IA.',
    submit: 'Gerar relatório',
    submitLoading: 'Gerando relatório...',
    reset: 'Criar novo relatório',
    submitFailed: 'Não foi possível gerar o relatório agora.',
    invalidResponse: 'Resposta inválida do servidor.',
    requestIdLabel: 'ID de suporte',
    fallbackNotice:
      'Relatório gerado em modo resiliente (fallback). Configure a IA para recomendações mais profundas.',
    required: 'Campo obrigatório.',
    invalidValue: 'Valor inválido.',
    dateOrderError: 'A data de volta deve ser igual ou posterior à data de ida.',
    totalPassengers: (count: number) => `Total informado: ${count} passageiro(s).`,
    assumptionsTitle: 'Assunções',
    share: 'Compartilhar relatório',
    shareLoading: 'Compartilhando...',
    shareCopied: 'Link copiado!',
    shareError: 'Não foi possível compartilhar o relatório.',
    fields: {
      departureDate: 'Data de ida',
      returnDate: 'Data de volta',
      flexibilityDays: 'Flexibilidade (dias)',
      origin: 'Origem (cidade/aeroporto)',
      destinations: 'Destinos candidatos',
      adults: 'Adultos',
      children: 'Crianças',
      infants: 'Bebês',
      childAges: 'Idades das crianças/bebês',
      flightPreference: 'Preferência de voo',
      flightPreferencePlaceholder: 'Indiferente',
      flightPreferenceOptions: {
        indiferente: 'Indiferente',
        direto: 'Somente diretos',
        '1_conexao': 'Até 1 conexão',
      },
      schedules: 'Horários',
      schedulesPlaceholder: 'Qualquer hora',
      schedulesOptions: {
        qualquer: 'Qualquer hora',
        manha: 'Manhã',
        tarde: 'Tarde',
        noite: 'Noite',
        madrugada: 'Madrugada',
        evitar_madrugada: 'Evitar madrugada',
      },
      baggage: 'Bagagem',
      baggagePlaceholder: 'Bagagem',
      baggageOptions: {
        mao: 'Mão',
        '1_despachada': '1 despachada',
        mais_despachadas: '2+ despachadas',
      },
      milesPrograms: 'Programas de milhas',
      bankPrograms: 'Bancos com pontos',
      documents: 'Vistos/documentos existentes',
      budget: 'Orçamento por pessoa (BRL)',
      riskTolerance: 'Tolerância a risco',
      riskTolerancePlaceholder: 'Baixa',
      riskToleranceOptions: {
        baixa: 'Baixa',
        media: 'Média',
        alta: 'Alta',
      },
      accommodation: 'Padrão de hospedagem',
      accommodationPlaceholder: 'Indiferente',
      accommodationOptions: {
        indiferente: 'Indiferente',
        '3': '3 estrelas',
        '4': '4 estrelas',
        '5': '5 estrelas',
      },
      neighborhoods: 'Bairros preferidos',
      profile: 'Preferências de experiência',
      restrictions: 'Restrições',
    },
    sections: {
      trip: 'Viagem',
      passengers: 'Passageiros',
      flight: 'Voos e bagagem',
      programs: 'Programas e orçamento',
      preferences: 'Preferências',
      constraints: 'Restrições',
      report: 'Relatório',
    },
  },
  en: {
    title: 'Miles Travel Planner',
    subtitle: 'Fill in your trip details and get an AI-generated strategic plan.',
    submit: 'Generate report',
    submitLoading: 'Generating report...',
    reset: 'Start a new report',
    submitFailed: 'Could not generate the report right now.',
    invalidResponse: 'Invalid server response.',
    requestIdLabel: 'Support ID',
    fallbackNotice:
      'Report generated in resilient fallback mode. Configure AI for deeper recommendations.',
    required: 'Required field.',
    invalidValue: 'Invalid value.',
    dateOrderError: 'Return date must be on or after departure date.',
    totalPassengers: (count: number) => `Total: ${count} passenger(s).`,
    assumptionsTitle: 'Assumptions',
    share: 'Share report',
    shareLoading: 'Sharing...',
    shareCopied: 'Link copied to clipboard!',
    shareError: 'Could not share the report.',
    fields: {
      departureDate: 'Departure date',
      returnDate: 'Return date',
      flexibilityDays: 'Flexibility (days)',
      origin: 'Origin (city/airport)',
      destinations: 'Candidate destinations',
      adults: 'Adults',
      children: 'Children',
      infants: 'Infants',
      childAges: 'Children/infants ages',
      flightPreference: 'Flight preference',
      flightPreferencePlaceholder: 'No preference',
      flightPreferenceOptions: {
        indiferente: 'No preference',
        direto: 'Direct only',
        '1_conexao': 'Up to 1 layover',
      },
      schedules: 'Schedule',
      schedulesPlaceholder: 'Any time',
      schedulesOptions: {
        qualquer: 'Any time',
        manha: 'Morning',
        tarde: 'Afternoon',
        noite: 'Evening',
        madrugada: 'Late night',
        evitar_madrugada: 'Avoid late night',
      },
      baggage: 'Baggage',
      baggagePlaceholder: 'Baggage',
      baggageOptions: {
        mao: 'Carry-on only',
        '1_despachada': '1 checked bag',
        mais_despachadas: '2+ checked bags',
      },
      milesPrograms: 'Miles programs',
      bankPrograms: 'Banks with points',
      documents: 'Existing visas/documents',
      budget: 'Budget per person (BRL)',
      riskTolerance: 'Risk tolerance',
      riskTolerancePlaceholder: 'Low',
      riskToleranceOptions: {
        baixa: 'Low',
        media: 'Medium',
        alta: 'High',
      },
      accommodation: 'Accommodation standard',
      accommodationPlaceholder: 'No preference',
      accommodationOptions: {
        indiferente: 'No preference',
        '3': '3-star',
        '4': '4-star',
        '5': '5-star',
      },
      neighborhoods: 'Preferred neighborhoods',
      profile: 'Experience preferences',
      restrictions: 'Constraints',
    },
    sections: {
      trip: 'Trip',
      passengers: 'Passengers',
      flight: 'Flights and baggage',
      programs: 'Programs and budget',
      preferences: 'Preferences',
      constraints: 'Constraints',
      report: 'Report',
    },
  },
} as const;

function validateForm(formData: TravelPreferences, locale: Locale): FieldErrors {
  const t = labels[locale] ?? labels['pt-BR'];
  const parsed = travelPreferencesSchema.safeParse(formData);
  if (parsed.success) return {};

  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (typeof field !== 'string') continue;
    const key = field as keyof TravelPreferences;
    if (errors[key]) continue;
    if (issue.code === 'custom' && key === 'data_volta') {
      errors[key] = t.dateOrderError;
      continue;
    }
    errors[key] =
      issue.code === 'too_small' || issue.code === 'invalid_type' ? t.required : t.invalidValue;
  }

  return errors;
}

export default function PlannerForm({ locale }: { locale: Locale }) {
  const [formData, setFormData] = useState<TravelPreferences>(initialTravelPreferences);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [report, setReport] = useState<PlannerReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fallbackNoticeVisible, setFallbackNoticeVisible] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const t = labels[locale] ?? labels['pt-BR'];
  const f = t.fields;

  const totalPassengers = useMemo(
    () => formData.num_adultos + formData.num_chd + formData.num_inf,
    [formData.num_adultos, formData.num_chd, formData.num_inf]
  );

  useEffect(() => {
    const source = readPlannerFunnelSource();
    if (!source) return;
    capturePlannerFunnelEvent(plannerFunnelEvents.plannerOpened, {
      source,
      locale,
    });
  }, [locale]);

  function updateField<K extends keyof TravelPreferences>(key: K, value: TravelPreferences[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError('');
    const nextErrors = validateForm(formData, locale);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setReport(null);
    setFallbackNoticeVisible(false);

    try {
      const funnelSource = readPlannerFunnelSource();
      const response = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          source: funnelSource ?? undefined,
          preferences: formData,
        }),
      });

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        const problem = parsePlannerProblemDetails(payload);
        const errorTitle = problem?.title;
        const requestId = problem?.requestId ?? response.headers.get('x-request-id') ?? undefined;
        const retryAfterSeconds = problem?.retryAfterSeconds;
        const retryHint =
          typeof retryAfterSeconds === 'number'
            ? locale === 'pt-BR'
              ? ` Tente novamente em ${retryAfterSeconds}s.`
              : ` Retry in ${retryAfterSeconds}s.`
            : '';

        setSubmitError(
          requestId
            ? `${errorTitle ?? t.submitFailed}${retryHint} ${t.requestIdLabel}: ${requestId}`
            : `${errorTitle ?? t.submitFailed}${retryHint}`
        );
        return;
      }

      const success = parsePlannerGenerateSuccessPayload(payload);
      if (!success) {
        setSubmitError(t.invalidResponse);
        return;
      }

      if (funnelSource) {
        capturePlannerFunnelEvent(plannerFunnelEvents.plannerGenerated, {
          source: funnelSource,
          locale,
          mode: success.mode,
          channel: 'client',
          passengers: totalPassengers,
        });
        clearPlannerFunnelSource();
      }

      setReport(success.report);
      setFallbackNoticeVisible(success.mode === 'fallback');
    } catch {
      setSubmitError(t.submitFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setReport(null);
    setSubmitError('');
    setFallbackNoticeVisible(false);
    setErrors({});
    setFormData(initialTravelPreferences);
  }

  async function handleShare() {
    if (!report) return;
    setIsSharing(true);
    setShareStatus('idle');

    try {
      const res = await fetch('/api/planner/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report, locale }),
      });

      if (!res.ok) {
        setShareStatus('error');
        return;
      }

      const data = await res.json();
      const fullUrl = `${window.location.origin}${data.url}`;

      await navigator.clipboard.writeText(fullUrl);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 3000);
    } catch {
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 4000);
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.sections.trip}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
              >
                {submitError}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="data_ida">{f.departureDate}</Label>
                <Input
                  id="data_ida"
                  type="date"
                  value={formData.data_ida}
                  onChange={(event) => updateField('data_ida', event.target.value)}
                />
                {errors.data_ida && <p className="text-xs text-destructive">{errors.data_ida}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_volta">{f.returnDate}</Label>
                <Input
                  id="data_volta"
                  type="date"
                  value={formData.data_volta}
                  onChange={(event) => updateField('data_volta', event.target.value)}
                />
                {errors.data_volta && (
                  <p className="text-xs text-destructive">{errors.data_volta}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="flex_dias">{f.flexibilityDays}</Label>
                <Input
                  id="flex_dias"
                  type="number"
                  min={0}
                  max={30}
                  inputMode="numeric"
                  value={formData.flex_dias}
                  onChange={(event) => updateField('flex_dias', event.target.value)}
                />
                {errors.flex_dias && <p className="text-xs text-destructive">{errors.flex_dias}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="origens">{f.origin}</Label>
                <Input
                  id="origens"
                  minLength={2}
                  maxLength={200}
                  value={formData.origens}
                  onChange={(event) => updateField('origens', event.target.value)}
                />
                {errors.origens && <p className="text-xs text-destructive">{errors.origens}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinos">{f.destinations}</Label>
              <Input
                id="destinos"
                minLength={2}
                maxLength={200}
                value={formData.destinos}
                onChange={(event) => updateField('destinos', event.target.value)}
              />
              {errors.destinos && <p className="text-xs text-destructive">{errors.destinos}</p>}
            </div>

            <Separator />

            <div>
              <h2 className="text-base font-semibold">{t.sections.passengers}</h2>
              <p className="text-sm text-muted-foreground">{t.totalPassengers(totalPassengers)}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="num_adultos">{f.adults}</Label>
                <Input
                  id="num_adultos"
                  type="number"
                  min={1}
                  max={9}
                  value={formData.num_adultos}
                  onChange={(event) => updateField('num_adultos', Number(event.target.value) || 0)}
                />
                {errors.num_adultos && (
                  <p className="text-xs text-destructive">{errors.num_adultos}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="num_chd">{f.children}</Label>
                <Input
                  id="num_chd"
                  type="number"
                  min={0}
                  max={9}
                  value={formData.num_chd}
                  onChange={(event) => updateField('num_chd', Number(event.target.value) || 0)}
                />
                {errors.num_chd && <p className="text-xs text-destructive">{errors.num_chd}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="num_inf">{f.infants}</Label>
                <Input
                  id="num_inf"
                  type="number"
                  min={0}
                  max={9}
                  value={formData.num_inf}
                  onChange={(event) => updateField('num_inf', Number(event.target.value) || 0)}
                />
                {errors.num_inf && <p className="text-xs text-destructive">{errors.num_inf}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="idades_chd_inf">{f.childAges}</Label>
              <Input
                id="idades_chd_inf"
                maxLength={120}
                value={formData.idades_chd_inf}
                onChange={(event) => updateField('idades_chd_inf', event.target.value)}
              />
              {errors.idades_chd_inf && (
                <p className="text-xs text-destructive">{errors.idades_chd_inf}</p>
              )}
            </div>

            <Separator />

            <div>
              <h2 className="text-base font-semibold">{t.sections.flight}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="preferencia_voo">{f.flightPreference}</Label>
                <Select
                  value={formData.preferencia_voo}
                  onValueChange={(value) =>
                    updateField('preferencia_voo', value as TravelPreferences['preferencia_voo'])
                  }
                >
                  <SelectTrigger id="preferencia_voo">
                    <SelectValue placeholder={f.flightPreferencePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indiferente">
                      {f.flightPreferenceOptions.indiferente}
                    </SelectItem>
                    <SelectItem value="direto">{f.flightPreferenceOptions.direto}</SelectItem>
                    <SelectItem value="1_conexao">
                      {f.flightPreferenceOptions['1_conexao']}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="horarios_voo">{f.schedules}</Label>
                <Select
                  value={formData.horarios_voo}
                  onValueChange={(value) =>
                    updateField('horarios_voo', value as TravelPreferences['horarios_voo'])
                  }
                >
                  <SelectTrigger id="horarios_voo">
                    <SelectValue placeholder={f.schedulesPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qualquer">{f.schedulesOptions.qualquer}</SelectItem>
                    <SelectItem value="manha">{f.schedulesOptions.manha}</SelectItem>
                    <SelectItem value="tarde">{f.schedulesOptions.tarde}</SelectItem>
                    <SelectItem value="noite">{f.schedulesOptions.noite}</SelectItem>
                    <SelectItem value="madrugada">{f.schedulesOptions.madrugada}</SelectItem>
                    <SelectItem value="evitar_madrugada">
                      {f.schedulesOptions.evitar_madrugada}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bagagem">{f.baggage}</Label>
                <Select
                  value={formData.bagagem}
                  onValueChange={(value) =>
                    updateField('bagagem', value as TravelPreferences['bagagem'])
                  }
                >
                  <SelectTrigger id="bagagem">
                    <SelectValue placeholder={f.baggagePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mao">{f.baggageOptions.mao}</SelectItem>
                    <SelectItem value="1_despachada">{f.baggageOptions['1_despachada']}</SelectItem>
                    <SelectItem value="mais_despachadas">
                      {f.baggageOptions.mais_despachadas}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-base font-semibold">{t.sections.programs}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="programas_milhas">{f.milesPrograms}</Label>
                <Input
                  id="programas_milhas"
                  maxLength={240}
                  value={formData.programas_milhas}
                  onChange={(event) => updateField('programas_milhas', event.target.value)}
                />
                {errors.programas_milhas && (
                  <p className="text-xs text-destructive">{errors.programas_milhas}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="programas_bancos">{f.bankPrograms}</Label>
                <Input
                  id="programas_bancos"
                  maxLength={240}
                  value={formData.programas_bancos}
                  onChange={(event) => updateField('programas_bancos', event.target.value)}
                />
                {errors.programas_bancos && (
                  <p className="text-xs text-destructive">{errors.programas_bancos}</p>
                )}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vistos_existentes">{f.documents}</Label>
                <Input
                  id="vistos_existentes"
                  maxLength={240}
                  value={formData.vistos_existentes}
                  onChange={(event) => updateField('vistos_existentes', event.target.value)}
                />
                {errors.vistos_existentes && (
                  <p className="text-xs text-destructive">{errors.vistos_existentes}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="orcamento_brl">{f.budget}</Label>
                <Input
                  id="orcamento_brl"
                  maxLength={120}
                  value={formData.orcamento_brl}
                  onChange={(event) => updateField('orcamento_brl', event.target.value)}
                />
                {errors.orcamento_brl && (
                  <p className="text-xs text-destructive">{errors.orcamento_brl}</p>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-base font-semibold">{t.sections.preferences}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="tolerancia_risco">{f.riskTolerance}</Label>
                <Select
                  value={formData.tolerancia_risco}
                  onValueChange={(value) =>
                    updateField('tolerancia_risco', value as TravelPreferences['tolerancia_risco'])
                  }
                >
                  <SelectTrigger id="tolerancia_risco">
                    <SelectValue placeholder={f.riskTolerancePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">{f.riskToleranceOptions.baixa}</SelectItem>
                    <SelectItem value="media">{f.riskToleranceOptions.media}</SelectItem>
                    <SelectItem value="alta">{f.riskToleranceOptions.alta}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospedagem_padrao">{f.accommodation}</Label>
                <Select
                  value={formData.hospedagem_padrao}
                  onValueChange={(value) =>
                    updateField(
                      'hospedagem_padrao',
                      value as TravelPreferences['hospedagem_padrao']
                    )
                  }
                >
                  <SelectTrigger id="hospedagem_padrao">
                    <SelectValue placeholder={f.accommodationPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indiferente">
                      {f.accommodationOptions.indiferente}
                    </SelectItem>
                    <SelectItem value="3">{f.accommodationOptions['3']}</SelectItem>
                    <SelectItem value="4">{f.accommodationOptions['4']}</SelectItem>
                    <SelectItem value="5">{f.accommodationOptions['5']}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairros_pref">{f.neighborhoods}</Label>
                <Input
                  id="bairros_pref"
                  maxLength={240}
                  value={formData.bairros_pref}
                  onChange={(event) => updateField('bairros_pref', event.target.value)}
                />
                {errors.bairros_pref && (
                  <p className="text-xs text-destructive">{errors.bairros_pref}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="perfil">{f.profile}</Label>
              <Input
                id="perfil"
                maxLength={240}
                value={formData.perfil}
                onChange={(event) => updateField('perfil', event.target.value)}
              />
              {errors.perfil && <p className="text-xs text-destructive">{errors.perfil}</p>}
            </div>

            <Separator />

            <div>
              <h2 className="text-base font-semibold">{t.sections.constraints}</h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="restricoes">{f.restrictions}</Label>
              <textarea
                id="restricoes"
                maxLength={800}
                className="min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.restricoes}
                onChange={(event) => updateField('restricoes', event.target.value)}
              />
              {errors.restricoes && <p className="text-xs text-destructive">{errors.restricoes}</p>}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t.submitLoading : t.submit}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader>
            <CardTitle>{t.sections.report}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {fallbackNoticeVisible && (
              <div className="rounded-md border border-amber-300/70 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                {t.fallbackNotice}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold">{report.title}</h3>
              <p className="text-sm text-muted-foreground">{report.summary}</p>
            </div>

            <div className="space-y-4">
              {report.sections.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {report.assumptions.length > 0 && (
              <div className="rounded-md border border-dashed border-muted-foreground/40 p-4">
                <h4 className="text-sm font-semibold">{t.assumptionsTitle}</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {report.assumptions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="button" variant="outline" onClick={handleReset}>
                {t.reset}
              </Button>
              <Button type="button" variant="secondary" onClick={handleShare} disabled={isSharing}>
                {isSharing ? t.shareLoading : t.share}
              </Button>
              {shareStatus === 'copied' && (
                <span className="text-sm text-green-600 dark:text-green-400">{t.shareCopied}</span>
              )}
              {shareStatus === 'error' && (
                <span className="text-sm text-destructive">{t.shareError}</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
