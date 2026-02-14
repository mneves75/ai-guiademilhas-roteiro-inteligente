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

interface StepFlightProps {
  formData: TravelPreferences;
  updateField: <K extends keyof TravelPreferences>(key: K, value: TravelPreferences[K]) => void;
  errors: FieldErrors;
  fieldLabels: {
    flightPreference: string;
    flightPreferencePlaceholder: string;
    flightPreferenceOptions: {
      indiferente: string;
      direto: string;
      '1_conexao': string;
    };
    schedules: string;
    schedulesPlaceholder: string;
    schedulesOptions: {
      qualquer: string;
      manha: string;
      tarde: string;
      noite: string;
      madrugada: string;
      evitar_madrugada: string;
    };
    baggage: string;
    baggagePlaceholder: string;
    baggageOptions: {
      mao: string;
      '1_despachada': string;
      mais_despachadas: string;
    };
    milesPrograms: string;
    bankPrograms: string;
    budget: string;
  };
}

export function StepFlight({ formData, updateField, errors, fieldLabels }: StepFlightProps) {
  const f = fieldLabels;

  return (
    <div className="space-y-4">
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
              <SelectItem value="indiferente">{f.flightPreferenceOptions.indiferente}</SelectItem>
              <SelectItem value="direto">{f.flightPreferenceOptions.direto}</SelectItem>
              <SelectItem value="1_conexao">{f.flightPreferenceOptions['1_conexao']}</SelectItem>
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
            onValueChange={(value) => updateField('bagagem', value as TravelPreferences['bagagem'])}
          >
            <SelectTrigger id="bagagem">
              <SelectValue placeholder={f.baggagePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mao">{f.baggageOptions.mao}</SelectItem>
              <SelectItem value="1_despachada">{f.baggageOptions['1_despachada']}</SelectItem>
              <SelectItem value="mais_despachadas">{f.baggageOptions.mais_despachadas}</SelectItem>
            </SelectContent>
          </Select>
        </div>
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

      <div className="space-y-2">
        <Label htmlFor="orcamento_brl">{f.budget}</Label>
        <Input
          id="orcamento_brl"
          maxLength={120}
          value={formData.orcamento_brl}
          onChange={(event) => updateField('orcamento_brl', event.target.value)}
        />
        {errors.orcamento_brl && <p className="text-xs text-destructive">{errors.orcamento_brl}</p>}
      </div>
    </div>
  );
}
