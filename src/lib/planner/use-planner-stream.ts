'use client';

import { useState, useCallback, useRef } from 'react';
import type { Locale } from '@/lib/locale';
import type { PlannerReport, ReportSection, TravelPreferences, PlannerStreamEvent } from './types';
import { parsePlannerProblemDetails } from './api-contract';

export type StreamState =
  | { status: 'idle' }
  | { status: 'streaming'; title?: string; summary?: string; sections: ReportSection[] }
  | { status: 'complete'; report: PlannerReport; mode: 'ai' | 'fallback'; planId?: string }
  | { status: 'error'; message: string };

export function usePlannerStream() {
  const [state, setState] = useState<StreamState>({ status: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (preferences: TravelPreferences, locale: Locale, source?: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ status: 'streaming', sections: [] });

      try {
        const response = await fetch('/api/planner/generate-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale, source: source ?? undefined, preferences }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const payload = await response.json().catch(() => null);
          const problem = parsePlannerProblemDetails(payload);
          const msg =
            problem?.title ??
            (locale === 'pt-BR'
              ? 'Não foi possível gerar o relatório.'
              : 'Could not generate the report.');
          setState({ status: 'error', message: msg });
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6);
            let event: PlannerStreamEvent;
            try {
              event = JSON.parse(jsonStr);
            } catch {
              continue;
            }

            if (event.type === 'delta') {
              setState((prev) => {
                if (prev.status !== 'streaming') return prev;
                return {
                  status: 'streaming',
                  title: event.title ?? prev.title,
                  summary: event.summary ?? prev.summary,
                  sections: event.sections,
                };
              });
            } else if (event.type === 'complete') {
              setState({
                status: 'complete',
                report: event.report,
                mode: event.mode,
                planId: event.planId,
              });
            } else if (event.type === 'error') {
              setState({ status: 'error', message: event.message });
            }
          }
        }

        setState((prev) => {
          if (prev.status === 'streaming') {
            return {
              status: 'error',
              message:
                locale === 'pt-BR'
                  ? 'Stream interrompido inesperadamente.'
                  : 'Stream interrupted unexpectedly.',
            };
          }
          return prev;
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setState({
          status: 'error',
          message:
            locale === 'pt-BR'
              ? 'Erro de conexão ao gerar relatório.'
              : 'Connection error generating report.',
        });
      }
    },
    []
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: 'idle' });
  }, []);

  return { state, generate, reset };
}
