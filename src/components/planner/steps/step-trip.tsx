'use client';

import type { TravelPreferences } from '@/lib/planner/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FieldErrors = Partial<Record<keyof TravelPreferences, string>>;

interface StepTripProps {
  formData: TravelPreferences;
  updateField: <K extends keyof TravelPreferences>(key: K, value: TravelPreferences[K]) => void;
  errors: FieldErrors;
  fieldLabels: {
    departureDate: string;
    returnDate: string;
    flexibilityDays: string;
    origin: string;
    destinations: string;
  };
}

export function StepTrip({ formData, updateField, errors, fieldLabels }: StepTripProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="data_ida">{fieldLabels.departureDate}</Label>
          <Input
            id="data_ida"
            type="date"
            value={formData.data_ida}
            onChange={(event) => updateField('data_ida', event.target.value)}
          />
          {errors.data_ida && <p className="text-xs text-destructive">{errors.data_ida}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="data_volta">{fieldLabels.returnDate}</Label>
          <Input
            id="data_volta"
            type="date"
            value={formData.data_volta}
            onChange={(event) => updateField('data_volta', event.target.value)}
          />
          {errors.data_volta && <p className="text-xs text-destructive">{errors.data_volta}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="flex_dias">{fieldLabels.flexibilityDays}</Label>
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
          <Label htmlFor="origens">{fieldLabels.origin}</Label>
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
        <Label htmlFor="destinos">{fieldLabels.destinations}</Label>
        <Input
          id="destinos"
          minLength={2}
          maxLength={200}
          value={formData.destinos}
          onChange={(event) => updateField('destinos', event.target.value)}
        />
        {errors.destinos && <p className="text-xs text-destructive">{errors.destinos}</p>}
      </div>
    </div>
  );
}
