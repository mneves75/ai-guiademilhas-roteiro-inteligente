'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Locale } from '@/lib/locale';

import { getItemText } from '@/lib/planner/types';
import { ReportItemView } from '@/components/planner/report-item';
import { usePlannerStream } from '@/lib/planner/use-planner-stream';
import { plannerFunnelEvents } from '@/lib/analytics/funnel';
import {
  capturePlannerFunnelEvent,
  clearPlannerFunnelSource,
  readPlannerFunnelSource,
} from '@/lib/analytics/funnel-client';
import { useWizardForm, TOTAL_STEPS, type StepIndex } from '@/hooks/use-wizard-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WizardProgress } from '@/components/planner/wizard-progress';
import { StepTrip } from '@/components/planner/steps/step-trip';
import { StepPassengers } from '@/components/planner/steps/step-passengers';
import { StepFlight } from '@/components/planner/steps/step-flight';
import { StepPreferences } from '@/components/planner/steps/step-preferences';

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
    downloadPdf: 'Baixar PDF',
    streaming: {
      analyzing: 'Analisando sua viagem...',
      generating: 'Gerando relatório...',
      saved: 'Salvo',
    },
    wizard: {
      next: 'Próximo',
      back: 'Voltar',
      skipAndGenerate: 'Pular e gerar',
      stepLabels: ['Viagem', 'Passageiros', 'Voo e Milhas', 'Preferências'],
    },
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
    downloadPdf: 'Download PDF',
    streaming: {
      analyzing: 'Analyzing your trip...',
      generating: 'Generating report...',
      saved: 'Saved',
    },
    wizard: {
      next: 'Next',
      back: 'Back',
      skipAndGenerate: 'Skip and generate',
      stepLabels: ['Trip', 'Passengers', 'Flight & Miles', 'Preferences'],
    },
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

export default function PlannerForm({ locale }: { locale: Locale }) {
  const wizard = useWizardForm();
  const { state: streamState, generate, reset: resetStream } = usePlannerStream();
  const [submitError, setSubmitError] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const t = labels[locale] ?? labels['pt-BR'];
  const f = t.fields;

  const totalPassengers = useMemo(
    () => wizard.formData.num_adultos + wizard.formData.num_chd + wizard.formData.num_inf,
    [wizard.formData.num_adultos, wizard.formData.num_chd, wizard.formData.num_inf]
  );

  const isSubmitting = streamState.status === 'streaming';
  const report = streamState.status === 'complete' ? streamState.report : null;
  const fallbackNoticeVisible =
    streamState.status === 'complete' && streamState.mode === 'fallback';
  const planId = streamState.status === 'complete' ? streamState.planId : undefined;
  const displayError = streamState.status === 'error' ? streamState.message : submitError;

  // Show form only when idle or error (not while streaming or after complete)
  const showForm = streamState.status === 'idle' || streamState.status === 'error';

  useEffect(() => {
    const source = readPlannerFunnelSource();
    if (!source) return;
    capturePlannerFunnelEvent(plannerFunnelEvents.plannerOpened, {
      source,
      locale,
    });
  }, [locale]);

  function handleSubmit() {
    setSubmitError('');
    if (!wizard.validateAll()) {
      // Find the first step with errors and navigate to it
      const stepsToCheck: StepIndex[] = [0, 1, 2];
      for (const step of stepsToCheck) {
        if (!wizard.validateStep(step)) {
          wizard.goToStep(step);
          return;
        }
      }
      return;
    }

    const funnelSource = readPlannerFunnelSource();
    generate(wizard.formData, locale, funnelSource ?? undefined);

    if (funnelSource) {
      capturePlannerFunnelEvent(plannerFunnelEvents.plannerGenerated, {
        source: funnelSource,
        locale,
        mode: 'ai',
        channel: 'client',
        passengers: totalPassengers,
      });
      clearPlannerFunnelSource();
    }
  }

  function handleReset() {
    resetStream();
    setSubmitError('');
    setShareStatus('idle');
    wizard.clearDraft();
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

  function renderCurrentStep() {
    switch (wizard.currentStep) {
      case 0:
        return (
          <StepTrip
            formData={wizard.formData}
            updateField={wizard.updateField}
            errors={wizard.errors}
            fieldLabels={{
              departureDate: f.departureDate,
              returnDate: f.returnDate,
              flexibilityDays: f.flexibilityDays,
              origin: f.origin,
              destinations: f.destinations,
            }}
          />
        );
      case 1:
        return (
          <StepPassengers
            formData={wizard.formData}
            updateField={wizard.updateField}
            errors={wizard.errors}
            fieldLabels={{
              adults: f.adults,
              children: f.children,
              infants: f.infants,
              childAges: f.childAges,
            }}
            totalPassengersLabel={t.totalPassengers(totalPassengers)}
          />
        );
      case 2:
        return (
          <StepFlight
            formData={wizard.formData}
            updateField={wizard.updateField}
            errors={wizard.errors}
            fieldLabels={{
              flightPreference: f.flightPreference,
              flightPreferencePlaceholder: f.flightPreferencePlaceholder,
              flightPreferenceOptions: f.flightPreferenceOptions,
              schedules: f.schedules,
              schedulesPlaceholder: f.schedulesPlaceholder,
              schedulesOptions: f.schedulesOptions,
              baggage: f.baggage,
              baggagePlaceholder: f.baggagePlaceholder,
              baggageOptions: f.baggageOptions,
              milesPrograms: f.milesPrograms,
              bankPrograms: f.bankPrograms,
              budget: f.budget,
            }}
          />
        );
      case 3:
        return (
          <StepPreferences
            formData={wizard.formData}
            updateField={wizard.updateField}
            errors={wizard.errors}
            fieldLabels={{
              riskTolerance: f.riskTolerance,
              riskTolerancePlaceholder: f.riskTolerancePlaceholder,
              riskToleranceOptions: f.riskToleranceOptions,
              accommodation: f.accommodation,
              accommodationPlaceholder: f.accommodationPlaceholder,
              accommodationOptions: f.accommodationOptions,
              neighborhoods: f.neighborhoods,
              profile: f.profile,
              restrictions: f.restrictions,
              documents: f.documents,
            }}
          />
        );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="space-y-4">
            <WizardProgress
              currentStep={wizard.currentStep}
              totalSteps={TOTAL_STEPS}
              labels={t.wizard.stepLabels as unknown as string[]}
              onStepClick={(step) => wizard.goToStep(step as StepIndex)}
            />
          </CardHeader>
          <CardContent className="space-y-6">
            {displayError && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
              >
                {displayError}
              </div>
            )}

            {renderCurrentStep()}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-4 border-t">
              <div>
                {!wizard.isFirstStep && (
                  <Button type="button" variant="outline" onClick={wizard.goBack}>
                    {t.wizard.back}
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                {wizard.isLastStep && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {t.wizard.skipAndGenerate}
                  </Button>
                )}
                {wizard.isLastStep ? (
                  <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? t.streaming.generating : t.submit}
                  </Button>
                ) : (
                  <Button type="button" onClick={wizard.goNext}>
                    {t.wizard.next}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {streamState.status === 'streaming' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {t.streaming.generating}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {streamState.title && (
              <div>
                <h3 className="text-lg font-semibold">{streamState.title}</h3>
                {streamState.summary && (
                  <p className="text-sm text-muted-foreground">{streamState.summary}</p>
                )}
              </div>
            )}
            {streamState.sections.length > 0 && (
              <div className="space-y-4">
                {streamState.sections.map((section, idx) => (
                  <div
                    key={`${section.title}-${idx}`}
                    className="animate-in fade-in-0 slide-in-from-bottom-2 space-y-2 duration-300"
                  >
                    <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {section.items.map((item, i) => (
                        <li key={`${getItemText(item)}-${i}`}>
                          <ReportItemView item={item} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {t.sections.report}
              {planId && (
                <span className="ml-2 rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
                  {t.streaming.saved}
                </span>
              )}
            </CardTitle>
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
                    {section.items.map((item, i) => (
                      <li key={`${getItemText(item)}-${i}`}>
                        <ReportItemView item={item} />
                      </li>
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
              {planId && (
                <Button type="button" variant="secondary" asChild>
                  <a href={`/api/planner/plans/${planId}/pdf`} download>
                    {t.downloadPdf}
                  </a>
                </Button>
              )}
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
