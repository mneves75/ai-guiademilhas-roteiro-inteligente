'use client';

import { cn } from '@/lib/utils';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
  onStepClick?: (step: number) => void;
}

export function WizardProgress({
  currentStep,
  totalSteps,
  labels,
  onStepClick,
}: WizardProgressProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      {/* Desktop: full labels */}
      <ol className="hidden sm:flex items-center justify-between gap-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <li key={i} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => onStepClick?.(i)}
                className={cn(
                  'flex items-center gap-2 text-sm font-medium transition-colors',
                  isCompleted && 'text-primary cursor-pointer',
                  isCurrent && 'text-primary cursor-default',
                  !isCompleted && !isCurrent && 'text-muted-foreground cursor-pointer'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'ring-2 ring-primary bg-background text-primary',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="hidden md:inline">{labels[i]}</span>
              </button>
              {i < totalSteps - 1 && (
                <div
                  className={cn(
                    'h-px flex-1 transition-colors',
                    i < currentStep ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: compact bar with numbers */}
      <div className="flex sm:hidden items-center justify-between gap-1">
        {Array.from({ length: totalSteps }, (_, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={i} className="flex flex-1 items-center gap-1">
              <button
                type="button"
                onClick={() => onStepClick?.(i)}
                className="flex flex-col items-center gap-1"
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={labels[i]}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'ring-2 ring-primary bg-background text-primary',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={cn(
                    'text-[10px] leading-tight',
                    isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'
                  )}
                >
                  {labels[i]}
                </span>
              </button>
              {i < totalSteps - 1 && (
                <div
                  className={cn(
                    'h-px flex-1 self-start mt-4 transition-colors',
                    i < currentStep ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
