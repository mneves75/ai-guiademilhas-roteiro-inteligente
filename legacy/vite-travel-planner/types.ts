
import React from 'react';

export interface TravelPreferences {
  data_ida: string;
  data_volta: string;
  flex_dias: string;
  origens: string;
  destinos: string;
  num_adultos: number;
  num_chd: number;
  num_inf: number;
  idades_chd_inf: string;
  preferencia_voo: 'direto' | '1_conexao' | 'indiferente';
  horarios_voo: string;
  bagagem: 'mao' | '1_despachada' | 'mais_despachadas';
  programas_milhas: string;
  programas_bancos: string;
  vistos_existentes: string;
  orcamento_brl: string;
  tolerancia_risco: 'baixa' | 'media' | 'alta';
  perfil: string;
  hospedagem_padrao: '3' | '4' | '5' | 'indiferente';
  bairros_pref: string;
  restricoes: string;
}

export interface ReportData {
  text: string;
  sources: { title: string; uri: string }[];
}

export interface StepProps {
  formData: TravelPreferences;
  setFormData: React.Dispatch<React.SetStateAction<TravelPreferences>>;
}

export interface FormStep {
  title: string;
  description: string;
  component: React.FC<StepProps>;
}
