'use client';

import type { TravelPreferences } from '@/lib/planner/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FieldErrors = Partial<Record<keyof TravelPreferences, string>>;

interface StepPreferencesProps {
  formData: TravelPreferences;
  updateField: <K extends keyof TravelPreferences>(key: K, value: TravelPreferences[K]) => void;
  errors: FieldErrors;
  fieldLabels: {
    riskTolerance: string;
    riskTolerancePlaceholder: string;
    riskToleranceOptions: {
      baixa: string;
      media: string;
      alta: string;
    };
    accommodation: string;
    accommodationPlaceholder: string;
    accommodationOptions: {
      indiferente: string;
      '3': string;
      '4': string;
      '5': string;
    };
    neighborhoods: string;
    profile: string;
    restrictions: string;
    documents: string;
  };
}

export function StepPreferences({
  formData,
  updateField,
  errors,
  fieldLabels,
}: StepPreferencesProps) {
  const f = fieldLabels;

  return (
    <div className="space-y-4">
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
              updateField('hospedagem_padrao', value as TravelPreferences['hospedagem_padrao'])
            }
          >
            <SelectTrigger id="hospedagem_padrao">
              <SelectValue placeholder={f.accommodationPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="indiferente">{f.accommodationOptions.indiferente}</SelectItem>
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
          {errors.bairros_pref && <p className="text-xs text-destructive">{errors.bairros_pref}</p>}
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
    </div>
  );
}
