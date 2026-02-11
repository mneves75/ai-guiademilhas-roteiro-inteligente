import React, { useState, useMemo } from 'react';
import { TravelPreferences, ReportData } from './types';
import { initialTravelPreferences, formSteps } from './constants';
import { generateTravelReport } from './services/geminiService';
import StepIndicator from './components/StepIndicator';
import QuestionCard from './components/QuestionCard';
import ArrowLeftIcon from './components/icons/ArrowLeftIcon';
import ArrowRightIcon from './components/icons/ArrowRightIcon';
import SparklesIcon from './components/icons/SparklesIcon';
import LoadingSpinner from './components/LoadingSpinner';
import ReportDisplay from './components/ReportDisplay';

export default function App() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<TravelPreferences>(initialTravelPreferences);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = formSteps.length;
  const isLastStep = step === totalSteps - 1;

  // Validação dos passos
  const isCurrentStepValid = useMemo(() => {
    switch (step) {
      case 0: // Datas
        return !!formData.data_ida && !!formData.data_volta;
      case 1: // Origem e Destino
        return !!formData.origens && !!formData.destinos;
      case 2: // Passageiros
        return formData.num_adultos > 0;
      default:
        // Outros passos são opcionais ou possuem valores padrão
        return true;
    }
  }, [step, formData]);

  const handleNext = () => {
    if (step < totalSteps - 1 && isCurrentStepValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);
    setReport(null);
    try {
      const generatedReport = await generateTravelReport(formData);
      setReport(generatedReport);
    } catch (err) {
      setError('Ocorreu um erro ao gerar o relatório. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentStepComponent = useMemo(() => formSteps[step].component, [step]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <LoadingSpinner />
        <p className="text-lg text-gray-600 mt-4 font-medium">Gerando seu roteiro de viagem...</p>
        <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns instantes.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Ops! Algo deu errado.</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setReport(null);
              setIsLoading(false);
            }}
            className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (report) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <ReportDisplay data={report} preferences={formData} />
          <button
            onClick={() => {
              setReport(null);
              setStep(0);
              setFormData(initialTravelPreferences);
            }}
            className="mt-8 w-full sm:w-auto bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            Criar Novo Relatório
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 transition-all duration-500">
      <div className="w-full max-w-2xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
            Agente de Viagens IA
          </h1>
          <p className="text-md sm:text-lg text-gray-500 mt-2">
            Responda algumas perguntas e criaremos o roteiro perfeito para você.
          </p>
        </header>

        <QuestionCard title={formSteps[step].title} description={formSteps[step].description}>
          <StepIndicator currentStep={step + 1} totalSteps={totalSteps} />
          <div className="mt-8">
            <CurrentStepComponent formData={formData} setFormData={setFormData} />
          </div>
        </QuestionCard>

        <div className="mt-8 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeftIcon />
            Voltar
          </button>

          {isLastStep ? (
            <button
              onClick={handleGenerateReport}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-95"
            >
              Gerar Relatório
              <SparklesIcon />
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!isCurrentStepValid}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gray-900 rounded-lg shadow-md hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-95"
            >
              Continuar
              <ArrowRightIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
