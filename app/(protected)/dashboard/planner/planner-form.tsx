'use client';

import { useMemo, useState } from 'react';
import type { Locale } from '@/lib/locale';
import { initialTravelPreferences } from '@/lib/planner/constants';
import type { PlannerReport, TravelPreferences } from '@/lib/planner/types';
import {
  parsePlannerGenerateSuccessPayload,
  parsePlannerProblemDetails,
} from '@/lib/planner/api-contract';
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
  const errors: FieldErrors = {};

  if (!formData.data_ida) errors.data_ida = t.required;
  if (!formData.data_volta) errors.data_volta = t.required;
  if (!formData.origens.trim()) errors.origens = t.required;
  if (!formData.destinos.trim()) errors.destinos = t.required;
  if (formData.num_adultos <= 0) errors.num_adultos = t.required;

  return errors;
}

export default function PlannerForm({ locale }: { locale: Locale }) {
  const [formData, setFormData] = useState<TravelPreferences>(initialTravelPreferences);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [report, setReport] = useState<PlannerReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fallbackNoticeVisible, setFallbackNoticeVisible] = useState(false);

  const t = labels[locale] ?? labels['pt-BR'];

  const totalPassengers = useMemo(
    () => formData.num_adultos + formData.num_chd + formData.num_inf,
    [formData.num_adultos, formData.num_chd, formData.num_inf]
  );

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
      const response = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          preferences: formData,
        }),
      });

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        const problem = parsePlannerProblemDetails(payload);
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
            ? `${t.submitFailed}${retryHint} ${t.requestIdLabel}: ${requestId}`
            : `${t.submitFailed}${retryHint}`
        );
        return;
      }

      const success = parsePlannerGenerateSuccessPayload(payload);
      if (!success) {
        setSubmitError(t.invalidResponse);
        return;
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
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {submitError}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="data_ida">Data de ida</Label>
                <Input
                  id="data_ida"
                  type="date"
                  value={formData.data_ida}
                  onChange={(event) => updateField('data_ida', event.target.value)}
                />
                {errors.data_ida && <p className="text-xs text-destructive">{errors.data_ida}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_volta">Data de volta</Label>
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
                <Label htmlFor="flex_dias">Flexibilidade (dias)</Label>
                <Input
                  id="flex_dias"
                  value={formData.flex_dias}
                  onChange={(event) => updateField('flex_dias', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="origens">Origem (cidade/aeroporto)</Label>
                <Input
                  id="origens"
                  value={formData.origens}
                  onChange={(event) => updateField('origens', event.target.value)}
                />
                {errors.origens && <p className="text-xs text-destructive">{errors.origens}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinos">Destinos candidatos</Label>
              <Input
                id="destinos"
                value={formData.destinos}
                onChange={(event) => updateField('destinos', event.target.value)}
              />
              {errors.destinos && <p className="text-xs text-destructive">{errors.destinos}</p>}
            </div>

            <Separator />

            <div>
              <h2 className="text-base font-semibold">{t.sections.passengers}</h2>
              <p className="text-sm text-muted-foreground">
                {locale === 'pt-BR'
                  ? `Total informado: ${totalPassengers} passageiro(s).`
                  : `Total: ${totalPassengers} passenger(s).`}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="num_adultos">Adultos</Label>
                <Input
                  id="num_adultos"
                  type="number"
                  min={1}
                  value={formData.num_adultos}
                  onChange={(event) => updateField('num_adultos', Number(event.target.value) || 0)}
                />
                {errors.num_adultos && (
                  <p className="text-xs text-destructive">{errors.num_adultos}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="num_chd">Crianças</Label>
                <Input
                  id="num_chd"
                  type="number"
                  min={0}
                  value={formData.num_chd}
                  onChange={(event) => updateField('num_chd', Number(event.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="num_inf">Bebês</Label>
                <Input
                  id="num_inf"
                  type="number"
                  min={0}
                  value={formData.num_inf}
                  onChange={(event) => updateField('num_inf', Number(event.target.value) || 0)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="idades_chd_inf">Idades das crianças/bebês</Label>
              <Input
                id="idades_chd_inf"
                value={formData.idades_chd_inf}
                onChange={(event) => updateField('idades_chd_inf', event.target.value)}
              />
            </div>

            <Separator />

            <div>
              <h2 className="text-base font-semibold">{t.sections.flight}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Preferência de voo</Label>
                <Select
                  value={formData.preferencia_voo}
                  onValueChange={(value) =>
                    updateField('preferencia_voo', value as TravelPreferences['preferencia_voo'])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Indiferente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indiferente">Indiferente</SelectItem>
                    <SelectItem value="direto">Somente diretos</SelectItem>
                    <SelectItem value="1_conexao">Até 1 conexão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horários</Label>
                <Select
                  value={formData.horarios_voo}
                  onValueChange={(value) =>
                    updateField('horarios_voo', value as TravelPreferences['horarios_voo'])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Qualquer hora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qualquer">Qualquer hora</SelectItem>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="noite">Noite</SelectItem>
                    <SelectItem value="madrugada">Madrugada</SelectItem>
                    <SelectItem value="evitar_madrugada">Evitar madrugada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bagagem</Label>
                <Select
                  value={formData.bagagem}
                  onValueChange={(value) =>
                    updateField('bagagem', value as TravelPreferences['bagagem'])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bagagem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mao">Mão</SelectItem>
                    <SelectItem value="1_despachada">1 despachada</SelectItem>
                    <SelectItem value="mais_despachadas">2+ despachadas</SelectItem>
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
                <Label htmlFor="programas_milhas">Programas de milhas</Label>
                <Input
                  id="programas_milhas"
                  value={formData.programas_milhas}
                  onChange={(event) => updateField('programas_milhas', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="programas_bancos">Bancos com pontos</Label>
                <Input
                  id="programas_bancos"
                  value={formData.programas_bancos}
                  onChange={(event) => updateField('programas_bancos', event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vistos_existentes">Vistos/documentos existentes</Label>
                <Input
                  id="vistos_existentes"
                  value={formData.vistos_existentes}
                  onChange={(event) => updateField('vistos_existentes', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orcamento_brl">Orçamento por pessoa (BRL)</Label>
                <Input
                  id="orcamento_brl"
                  value={formData.orcamento_brl}
                  onChange={(event) => updateField('orcamento_brl', event.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-base font-semibold">{t.sections.preferences}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Tolerância a risco</Label>
                <Select
                  value={formData.tolerancia_risco}
                  onValueChange={(value) =>
                    updateField('tolerancia_risco', value as TravelPreferences['tolerancia_risco'])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Baixa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Padrão de hospedagem</Label>
                <Select
                  value={formData.hospedagem_padrao}
                  onValueChange={(value) =>
                    updateField(
                      'hospedagem_padrao',
                      value as TravelPreferences['hospedagem_padrao']
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Indiferente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indiferente">Indiferente</SelectItem>
                    <SelectItem value="3">3 estrelas</SelectItem>
                    <SelectItem value="4">4 estrelas</SelectItem>
                    <SelectItem value="5">5 estrelas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairros_pref">Bairros preferidos</Label>
                <Input
                  id="bairros_pref"
                  value={formData.bairros_pref}
                  onChange={(event) => updateField('bairros_pref', event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="perfil">Preferências de experiência</Label>
              <Input
                id="perfil"
                value={formData.perfil}
                onChange={(event) => updateField('perfil', event.target.value)}
              />
            </div>

            <Separator />

            <div>
              <h2 className="text-base font-semibold">{t.sections.constraints}</h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="restricoes">Restrições</Label>
              <textarea
                id="restricoes"
                className="min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.restricoes}
                onChange={(event) => updateField('restricoes', event.target.value)}
              />
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
                <h4 className="text-sm font-semibold">
                  {locale === 'pt-BR' ? 'Assunções' : 'Assumptions'}
                </h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {report.assumptions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="outline" onClick={handleReset}>
                {t.reset}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
