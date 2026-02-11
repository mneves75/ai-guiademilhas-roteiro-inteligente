import { TravelPreferences, FormStep } from './types';
import React, { ChangeEvent, useState, KeyboardEvent } from 'react';

// Helper component for text inputs
const TextInput: React.FC<{ label: string; name: keyof TravelPreferences; value: string; placeholder: string; onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; type?: string; isTextArea?: boolean }> = ({ label, name, value, placeholder, onChange, type = 'text', isTextArea = false }) => (
    React.createElement("div", { className: "mb-4" },
        React.createElement("label", { htmlFor: name, className: "block text-sm font-medium text-gray-700 mb-1" }, label),
        isTextArea ? (
            React.createElement("textarea", { id: name, name: name, value: value, onChange: onChange, placeholder: placeholder, rows: 3, className: "w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" })
        ) : (
            React.createElement("input", { type: type, id: name, name: name, value: value, onChange: onChange, placeholder: placeholder, className: "w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" })
        )
    )
);

// Helper component for select inputs
const SelectInput: React.FC<{ label: string; name: keyof TravelPreferences; value: string; onChange: (e: ChangeEvent<HTMLSelectElement>) => void; options: {value: string; label: string}[] }> = ({ label, name, value, onChange, options }) => (
    React.createElement("div", { className: "mb-4" },
        React.createElement("label", { htmlFor: name, className: "block text-sm font-medium text-gray-700 mb-1" }, label),
        React.createElement("select", { id: name, name: name, value: value, onChange: onChange, className: "w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" },
            ...options.map(opt => React.createElement("option", { key: opt.value, value: opt.value }, opt.label))
        )
    )
);

// Helper component for number inputs
const NumberInput: React.FC<{ label: string; name: keyof TravelPreferences; value: number; onChange: (e: ChangeEvent<HTMLInputElement>) => void; min?: number }> = ({ label, name, value, onChange, min=0 }) => (
    React.createElement("div", { className: "mb-4" },
        React.createElement("label", { htmlFor: name, className: "block text-sm font-medium text-gray-700 mb-1" }, label),
        React.createElement("input", { type: "number", id: name, name: name, value: value, onChange: onChange, min: min, className: "w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" })
    )
);

// New Component for Multi-Tag Input
const MultiTagInput: React.FC<{
    label: string;
    name: keyof TravelPreferences;
    value: string;
    onChange: (e: any) => void;
    placeholder: string;
}> = ({ label, name, value, onChange, placeholder }) => {
    const [inputValue, setInputValue] = useState("");

    // Converte a string separada por vírgulas em array de tags
    const tags = value ? value.split(',').map(s => s.trim()).filter(s => s !== "") : [];

    const addTag = () => {
        const tagToAdd = inputValue.trim();
        if (tagToAdd && !tags.includes(tagToAdd)) {
            const newTags = [...tags, tagToAdd];
            // Simula o evento onChange esperado pelo pai
            onChange({ target: { name, value: newTags.join(', ') } });
            setInputValue("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        const newTags = tags.filter(tag => tag !== tagToRemove);
        onChange({ target: { name, value: newTags.join(', ') } });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    return React.createElement("div", { className: "mb-4" },
        React.createElement("label", { htmlFor: name, className: "block text-sm font-medium text-gray-700 mb-1" }, label),
        React.createElement("div", { className: "flex gap-2 mb-2" },
            React.createElement("input", {
                type: "text",
                id: name,
                value: inputValue,
                onChange: (e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value),
                onKeyDown: handleKeyDown,
                placeholder: placeholder,
                className: "flex-1 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            }),
            React.createElement("button", {
                type: "button",
                onClick: addTag,
                className: "px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
            }, "Adicionar")
        ),
        tags.length > 0 && React.createElement("div", { className: "flex flex-wrap gap-2 mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-inner" },
            tags.map((tag, index) => (
                React.createElement("span", { key: index, className: "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm transition-all hover:bg-indigo-100" },
                    tag,
                    React.createElement("button", {
                        type: "button",
                        onClick: () => removeTag(tag),
                        className: "ml-2 inline-flex items-center justify-center w-5 h-5 text-indigo-400 hover:text-red-500 rounded-full focus:outline-none transition-colors"
                    },
                        React.createElement("svg", { className: "w-3 h-3", fill: "currentColor", viewBox: "0 0 20 20" },
                            React.createElement("path", { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" })
                        )
                    )
                )
            ))
        ),
        React.createElement("p", { className: "text-xs text-gray-500 mt-2 ml-1" },
            "Digite a cidade e pressione ",
            React.createElement("strong", null, "Enter"),
            " ou clique em Adicionar."
        )
    );
};


// Form Steps Components
const Step1: React.FC<{ formData: TravelPreferences, setFormData: Function }> = ({ formData, setFormData }) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    return React.createElement(React.Fragment, null,
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
            React.createElement(TextInput, { label: "Data de Ida", name: "data_ida", type: "date", value: formData.data_ida, placeholder: "DD/MM/AAAA", onChange: handleChange }),
            React.createElement(TextInput, { label: "Data de Volta", name: "data_volta", type: "date", value: formData.data_volta, placeholder: "DD/MM/AAAA", onChange: handleChange })
        ),
        React.createElement(TextInput, { label: "Flexibilidade (Ex: 3 dias)", name: "flex_dias", value: formData.flex_dias, placeholder: "Ex: 3 dias para mais ou para menos", onChange: handleChange })
    );
};

const Step2: React.FC<{ formData: TravelPreferences, setFormData: Function }> = ({ formData, setFormData }) => {
    const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
    return React.createElement(React.Fragment, null,
        React.createElement(TextInput, { label: "Origem (Cidade/Aeroporto)", name: "origens", value: formData.origens, placeholder: "Ex: São Paulo (GRU), Rio de Janeiro", onChange: handleChange }),
        React.createElement(MultiTagInput, { 
            label: "Destinos Candidatos", 
            name: "destinos", 
            value: formData.destinos, 
            placeholder: "Ex: Paris, Londres, Roma...", 
            onChange: handleChange 
        })
    );
};

const Step3: React.FC<{ formData: TravelPreferences, setFormData: Function }> = ({ formData, setFormData }) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.value });
    return React.createElement(React.Fragment, null,
        React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4" },
             React.createElement(NumberInput, { label: "Adultos (18+)", name: "num_adultos", value: formData.num_adultos, onChange: handleChange, min: 1 }),
             React.createElement(NumberInput, { label: "Crianças (2-11)", name: "num_chd", value: formData.num_chd, onChange: handleChange }),
             React.createElement(NumberInput, { label: "Bebês (0-2)", name: "num_inf", value: formData.num_inf, onChange: handleChange })
        ),
        React.createElement(TextInput, { label: "Idade das Crianças/Bebês", name: "idades_chd_inf", value: formData.idades_chd_inf, placeholder: "Ex: 5, 10 (se houver)", onChange: handleChange })
    );
};

const Step4: React.FC<{ formData: TravelPreferences, setFormData: Function }> = ({ formData, setFormData }) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    return React.createElement(React.Fragment, null,
        React.createElement(SelectInput, { label: "Preferência de Voo", name: "preferencia_voo", value: formData.preferencia_voo, onChange: handleChange, options: [
            { value: 'indiferente', label: 'Indiferente' },
            { value: 'direto', label: 'Apenas voos diretos' },
            { value: '1_conexao', label: 'Até 1 conexão' },
        ] }),
        React.createElement(SelectInput, { label: "Bagagem", name: "bagagem", value: formData.bagagem, onChange: handleChange, options: [
            { value: 'mao', label: 'Apenas bagagem de mão' },
            { value: '1_despachada', label: '1 bagagem despachada' },
            { value: 'mais_despachadas', label: 'Mais de 1 bagagem despachada' },
        ] }),
         React.createElement(SelectInput, { label: "Horários de Voo", name: "horarios_voo", value: formData.horarios_voo, onChange: handleChange, options: [
            { value: 'qualquer', label: 'Qualquer hora' },
            { value: 'manha', label: 'Manhã (06:00 - 12:00)' },
            { value: 'tarde', label: 'Tarde (12:00 - 18:00)' },
            { value: 'noite', label: 'Noite (18:00 - 00:00)' },
            { value: 'madrugada', label: 'Madrugada (00:00 - 06:00)' },
            { value: 'evitar_madrugada', label: 'Evitar Madrugada' }
         ]})
    );
};

const Step5: React.FC<{ formData: TravelPreferences, setFormData: Function }> = ({ formData, setFormData }) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    return React.createElement(React.Fragment, null,
        React.createElement(TextInput, { label: "Programas de Milhas", name: "programas_milhas", value: formData.programas_milhas, placeholder: "Ex: LATAM Pass, Smiles, TudoAzul", onChange: handleChange }),
        React.createElement(TextInput, { label: "Bancos com Pontos", name: "programas_bancos", value: formData.programas_bancos, placeholder: "Ex: Livelo, Esfera, C6 Átomos", onChange: handleChange })
    );
};

const Step6: React.FC<{ formData: TravelPreferences, setFormData: Function }> = ({ formData, setFormData }) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    return React.createElement(React.Fragment, null,
        React.createElement(TextInput, { label: "Vistos/Documentos Já Possuídos", name: "vistos_existentes", value: formData.vistos_existentes, placeholder: "Ex: Visto Americano, Passaporte Europeu", onChange: handleChange }),
        React.createElement(TextInput, { label: "Orçamento Alvo por Pessoa (BRL)", name: "orcamento_brl", value: formData.orcamento_brl, placeholder: "Ex: R$ 5.000", onChange: handleChange })
    );
};

const Step7: React.FC<{ formData: TravelPreferences, setFormData: Function }> = ({ formData, setFormData }) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    return React.createElement(React.Fragment, null,
        React.createElement(SelectInput, { label: "Tolerância a Risco Climático", name: "tolerancia_risco", value: formData.tolerancia_risco, onChange: handleChange, options: [
            { value: 'baixa', label: 'Baixa' },
            { value: 'media', label: 'Média' },
            { value: 'alta', label: 'Alta' },
        ] }),
        React.createElement(TextInput, { label: "Preferências de Experiência", name: "perfil", value: formData.perfil, placeholder: "Ex: praia, compras, gastronomia, parques", onChange: handleChange }),
        React.createElement(SelectInput, { label: "Padrão de Hospedagem", name: "hospedagem_padrao", value: formData.hospedagem_padrao, onChange: handleChange, options: [
            { value: 'indiferente', label: 'Indiferente' },
            { value: '3', label: '3 estrelas' },
            { value: '4', label: '4 estrelas' },
            { value: '5', label: '5 estrelas' },
        ] }),
        React.createElement(TextInput, { label: "Bairros/Regiões Preferidos", name: "bairros_pref", value: formData.bairros_pref, placeholder: "Ex: perto do centro, em bairros tranquilos", onChange: handleChange })
    );
};

const Step8: React.FC<{ formData: TravelPreferences, setFormData: Function }> = ({ formData, setFormData }) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    return React.createElement(React.Fragment, null,
        React.createElement(TextInput, { label: "Restrições", name: "restricoes", value: formData.restricoes, placeholder: "Ex: acessibilidade, evitar cias específicas", onChange: handleChange, isTextArea: true })
    );
};


export const initialTravelPreferences: TravelPreferences = {
  data_ida: '',
  data_volta: '',
  flex_dias: '2',
  origens: '',
  destinos: '',
  num_adultos: 1,
  num_chd: 0,
  num_inf: 0,
  idades_chd_inf: '',
  preferencia_voo: 'indiferente',
  horarios_voo: 'qualquer',
  bagagem: '1_despachada',
  programas_milhas: '',
  programas_bancos: '',
  vistos_existentes: '',
  orcamento_brl: '',
  tolerancia_risco: 'baixa',
  perfil: 'praia, gastronomia',
  hospedagem_padrao: '4',
  bairros_pref: '',
  restricoes: '',
};

export const formSteps: FormStep[] = [
    { title: "Quando e para onde?", description: "Vamos começar com o básico: as datas e os locais da sua viagem.", component: Step1 },
    { title: "Origem e Destino", description: "De onde você vai sair e quais destinos estão na sua lista?", component: Step2 },
    { title: "Quem vai viajar?", description: "Informe o número e a idade dos passageiros.", component: Step3 },
    { title: "Preferências de Voo", description: "Como você prefere voar? Nos dê detalhes sobre voos e bagagens.", component: Step4 },
    { title: "Milhas e Pontos", description: "Informe seus programas de fidelidade para encontrarmos as melhores ofertas.", component: Step5 },
    { title: "Documentos e Orçamento", description: "Quais vistos você já possui e qual o orçamento planejado?", component: Step6 },
    { title: "Sua Viagem, Seu Estilo", description: "Conte-nos sobre o tipo de experiência e hospedagem que você busca.", component: Step7 },
    { title: "Detalhes Finais", description: "Existe alguma restrição ou informação adicional importante?", component: Step8 }
];