import { GoogleGenAI } from "@google/genai";
import { TravelPreferences, ReportData } from '../types';

const AGENT_PROMPT_TEMPLATE = `
Papel: Você é um Agente de Viagens Sênior + Analista de Tarifas & Programas de Milhas, focado em maximizar custo-benefício, conforto e risco climático mínimo. Sua resposta DEVE ser formatada em Markdown.

Missão: Recomendar, de forma comparativa e fundamentada, o melhor destino para a viagem no período informado, considerando origens e destinos candidatos.
 
Obrigatório: Pesquisar na web em tempo real (voos, milhas, clima, vistos/entradas) e registrar links, horário e data de cada consulta.

⸻

**Dados do Cliente para Análise:**

*   **Período:** Ida em {{data_ida}} e volta em {{data_volta}} (flexibilidade de {{flex_dias}} dias).
*   **Origens permitidas (códigos IATA e/ou cidades):** {{origens}}.
*   **Destinos candidatos:** {{destinos}}.
*   **Nº de passageiros:** {{num_adultos}} Adulto(s), {{num_chd}} Criança(s), {{num_inf}} Bebê(s).
*   **Idades Crianças/Bebês:** {{idades_chd_inf}}.
*   **Preferências de voo:** {{preferencia_voo}}, janelas/horários: "{{horarios_voo}}", bagagem: {{bagagem}}.
*   **Programas de milhas/cartões:** {{programas_milhas}}.
*   **Bancos com pontos transferíveis:** {{programas_bancos}}.
*   **Vistos/documentos já possuídos:** {{vistos_existentes}}.
*   **Orçamento alvo por pessoa (BRL):** {{orcamento_brl}}.
*   **Tolerância a risco climático:** {{tolerancia_risco}}.
*   **Preferências de experiência:** {{perfil}}.
*   **Hospedagem:** padrão {{hospedagem_padrao}} estrelas, bairros preferidos: "{{bairros_pref}}".
*   **Restrições:** {{restricoes}}.

**Se alguma informação crítica estiver faltando, use os padrões abaixo e mencione as assunções no relatório:**
*Padrões: 1 adulto, 1 item de mão + 1 despachada, aceita 1 conexão, tolerância a risco: baixa, sem visto EUA, flex ±1 dia, hospedagem 3-4*, perfil "praia + gastronomia".*

⸻

**Siga estritamente esta metodologia e formato de entrega:**

**1. Metodologia (execução em ordem):**
   1.1. **Voos - Dinheiro (cash):** Consultar agregadores (Google Flights, Skyscanner) e cias aéreas. Reportar menor tarifa total, duração, conexões, cias.
   1.2. **Voos - Milhas/Pontos:** Verificar disponibilidade real e custo (milhas + taxas) nos programas informados. Calcular custo efetivo.
   1.3. **Clima & Risco:** Analisar normais climatológicas e previsão. Detalhar temperatura, chuva, umidade e riscos sazonais (ex: furacões), incluindo probabilidade histórica.
   1.4. **Entrada & Logística:** Requisitos de vistos/documentos, traslados, e custo estimado de seguro-viagem.
   1.5. **Hospedagem:** Estimar faixa de preço/noite para o padrão desejado em bairros recomendados.
   1.6. **Custo Total Estimado:** Somar voo + hospedagem + traslados.

**2. Critérios & Scorecard (pese e ranqueie):**
   *   Atribua notas de 0 a 10 para cada critério.
   *   Pesos: Preço cash 25%, Milhas 20%, Tempo/Conexões 15%, Clima/Risco 20%, Visto/Documentos 10%, Experiência 5%, Logística local 5%.
   *   Apresente um ranking final (Top 1, Top 2, etc.).

**3. Entregáveis (formato Markdown OBRIGATÓRIO):**
   *   **Resumo Executivo:** Recomendação direta e objetiva.
   *   **Tabela Comparativa (Markdown):**
     | Destino | Origem | Menor cash (BRL) | Milhas+taxas (programa) | Duração/Conexões | Clima (T°, chuva, risco) | Visto |
     |---|---|---|---|---|---|---|
     | ... | ... | ... | ... | ... | ... | ... |
   *   **Scorecard:** Tabela com pesos, notas e pontuação final por destino.
   *   **Roteiro Sugerido:** 3-5 destaques realistas por destino.
   *   **Guias Detalhados:** Para CADA destino recomendado (top 3), crie OBRIGATORIAMENTE uma seção final usando EXATAMENTE o formato de cabeçalho "## Guia: [Nome do Destino]". Dentro desta seção, inclua bullet points para: "Principais Atrações", "Culinária Típica" e "Dicas Culturais".
   *   **Plano de Contingência:** Especialmente para riscos climáticos.
   *   **Fontes:** Links das fontes com timestamp.

**Linguagem:** Use PT-BR de forma clara e objetiva.
`;

const mapPreferenciaVoo = (pref: string) => {
    switch(pref) {
        case 'direto': return 'Apenas voos diretos';
        case '1_conexao': return 'Até 1 conexão';
        default: return 'Indiferente';
    }
}
const mapBagagem = (bag: string) => {
    switch(bag) {
        case 'mao': return 'Apenas bagagem de mão';
        case '1_despachada': return '1 bagagem despachada';
        case 'mais_despachadas': return 'Mais de 1 bagagem despachada';
        default: return 'Não especificado';
    }
}

const mapHorariosVoo = (hora: string) => {
    switch(hora) {
        case 'qualquer': return 'Qualquer horário';
        case 'manha': return 'Preferência por voos de manhã (06h-12h)';
        case 'tarde': return 'Preferência por voos a tarde (12h-18h)';
        case 'noite': return 'Preferência por voos a noite (18h-00h)';
        case 'madrugada': return 'Preferência por voos de madrugada';
        case 'evitar_madrugada': return 'Evitar voos de madrugada';
        default: return hora || 'Qualquer horário';
    }
}

function buildPrompt(preferences: TravelPreferences): string {
  return AGENT_PROMPT_TEMPLATE
    .replace('{{data_ida}}', preferences.data_ida || 'Não informado')
    .replace('{{data_volta}}', preferences.data_volta || 'Não informado')
    .replace('{{flex_dias}}', preferences.flex_dias || '0')
    .replace('{{origens}}', preferences.origens || 'Não informado')
    .replace('{{destinos}}', preferences.destinos || 'Não informado')
    .replace('{{num_adultos}}', String(preferences.num_adultos))
    .replace('{{num_chd}}', String(preferences.num_chd))
    .replace('{{num_inf}}', String(preferences.num_inf))
    .replace('{{idades_chd_inf}}', preferences.idades_chd_inf || 'N/A')
    .replace('{{preferencia_voo}}', mapPreferenciaVoo(preferences.preferencia_voo))
    .replace('{{horarios_voo}}', mapHorariosVoo(preferences.horarios_voo))
    .replace('{{bagagem}}', mapBagagem(preferences.bagagem))
    .replace('{{programas_milhas}}', preferences.programas_milhas || 'Nenhum informado')
    .replace('{{programas_bancos}}', preferences.programas_bancos || 'Nenhum informado')
    .replace('{{vistos_existentes}}', preferences.vistos_existentes || 'Nenhum informado')
    .replace('{{orcamento_brl}}', preferences.orcamento_brl || 'Não informado')
    .replace('{{tolerancia_risco}}', preferences.tolerancia_risco)
    .replace('{{perfil}}', preferences.perfil || 'Não informado')
    .replace('{{hospedagem_padrao}}', preferences.hospedagem_padrao === 'indiferente' ? 'Indiferente' : preferences.hospedagem_padrao)
    .replace('{{bairros_pref}}', preferences.bairros_pref || 'Sem preferência')
    .replace('{{restricoes}}', preferences.restricoes || 'Nenhuma');
}

export async function generateTravelReport(preferences: TravelPreferences): Promise<ReportData> {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = buildPrompt(preferences);

    try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt,
          config: {
            tools: [{googleSearch: {}}],
          }
        });

        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map(chunk => {
                const web = chunk.web;
                if (web && web.uri) {
                    return { title: web.title || web.uri, uri: web.uri };
                }
                return null;
            })
            .filter((s): s is { title: string; uri: string } => s !== null) || [];

        // Deduplicate sources
        const sourceMap = new Map<string, { title: string; uri: string }>();
        sources.forEach(s => sourceMap.set(s.uri, s));
        const uniqueSources = Array.from(sourceMap.values());

        return {
            text: response.text || "",
            sources: uniqueSources
        };
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate travel report from Gemini API.");
    }
}