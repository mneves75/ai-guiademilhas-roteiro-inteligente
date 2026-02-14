'use client';

import type { TravelPreferences } from '@/lib/planner/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FieldErrors = Partial<Record<keyof TravelPreferences, string>>;

interface StepPassengersProps {
  formData: TravelPreferences;
  updateField: <K extends keyof TravelPreferences>(key: K, value: TravelPreferences[K]) => void;
  errors: FieldErrors;
  fieldLabels: {
    adults: string;
    children: string;
    infants: string;
    childAges: string;
  };
  totalPassengersLabel: string;
}

export function StepPassengers({
  formData,
  updateField,
  errors,
  fieldLabels,
  totalPassengersLabel,
}: StepPassengersProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{totalPassengersLabel}</p>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="num_adultos">{fieldLabels.adults}</Label>
          <Input
            id="num_adultos"
            type="number"
            min={1}
            max={9}
            value={formData.num_adultos}
            onChange={(event) => updateField('num_adultos', Number(event.target.value) || 0)}
          />
          {errors.num_adultos && <p className="text-xs text-destructive">{errors.num_adultos}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="num_chd">{fieldLabels.children}</Label>
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
          <Label htmlFor="num_inf">{fieldLabels.infants}</Label>
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
        <Label htmlFor="idades_chd_inf">{fieldLabels.childAges}</Label>
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
    </div>
  );
}
