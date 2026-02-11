import React, { useMemo, useState } from 'react';
import SparklesIcon from './icons/SparklesIcon';
import { ReportData, TravelPreferences } from '../types';

interface ReportDisplayProps {
  data: ReportData;
  preferences: TravelPreferences;
}

interface ClimateData {
  destination: string;
  climateInfo: string;
  riskLevel: 'low' | 'medium' | 'high';
  temperature?: string;
}

interface FlightDeal {
  destination: string;
  origin: string;
  priceCash: string;
  priceMiles: string;
  duration: string;
  bookingLink: string;
}

interface TravelDates {
  departure: string;
  returnDate: string;
}

interface DestinationGuide {
    destination: string;
    content: string;
}

// Icons
const AirplaneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-[-45deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const MapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


// Helper to extract dates from text header
const extractDates = (markdown: string): TravelDates | null => {
  try {
    const idaMatch = markdown.match(/Ida em\s+([0-9\-\/]+)/i);
    const voltaMatch = markdown.match(/volta em\s+([0-9\-\/]+)/i);
    if (idaMatch && voltaMatch) {
      return { departure: idaMatch[1], returnDate: voltaMatch[1] };
    }
  } catch (e) { console.error("Error extracting dates", e); }
  return null;
};

// Helper to clean currency strings and return number
const parseCurrency = (value: string): number => {
    if (!value) return 0;
    const cleanStr = value.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
};

// Helper to extract budget estimation from markdown
const extractEstimatedTotal = (markdown: string): number | null => {
    const regex = /(?:Custo Total|Estimativa Total|Total Estimado).*?R\$\s*([\d.,]+)/i;
    const match = markdown.match(regex);
    if (match && match[1]) {
        return parseCurrency(match[1]);
    }
    return null;
};

// Helper to extract flight data
const extractFlightData = (markdown: string): FlightDeal[] => {
  const data: FlightDeal[] = [];
  const dates = extractDates(markdown);
  
  try {
    const lines = markdown.split('\n');
    let tableStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('|') && lines[i].toLowerCase().includes('destino') && lines[i].toLowerCase().includes('cash')) {
        tableStartIndex = i;
        break;
      }
    }

    if (tableStartIndex !== -1) {
      const headerCells = lines[tableStartIndex].split('|').map(c => c.trim()).filter(c => c);
      
      const idxDest = headerCells.findIndex(h => h.toLowerCase().includes('destino'));
      const idxOrig = headerCells.findIndex(h => h.toLowerCase().includes('origem'));
      const idxCash = headerCells.findIndex(h => h.toLowerCase().includes('cash'));
      const idxMiles = headerCells.findIndex(h => h.toLowerCase().includes('milhas'));
      const idxDur = headerCells.findIndex(h => h.toLowerCase().includes('duração') || h.toLowerCase().includes('conexões'));

      if (idxDest !== -1 && idxCash !== -1) {
        for (let i = tableStartIndex + 2; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line.startsWith('|')) break;

          const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          
          if (cells[idxDest]) {
            const dest = cells[idxDest].replace(/\*\*/g, '');
            const orig = idxOrig !== -1 ? cells[idxOrig].replace(/\*\*/g, '') : '';
            
            const query = `Flights to ${dest} from ${orig}`;
            let link = `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`;
            
            if (dates) {
               link += `%20on%20${dates.departure}%20through%20${dates.returnDate}`;
            }

            data.push({
              destination: dest,
              origin: orig,
              priceCash: cells[idxCash] || 'N/A',
              priceMiles: idxMiles !== -1 ? cells[idxMiles] : 'N/A',
              duration: idxDur !== -1 ? cells[idxDur] : 'N/A',
              bookingLink: link
            });
          }
        }
      }
    }
  } catch (e) { console.error("Failed to parse flight data", e); }
  return data;
};

// Helper to extract climate data
const extractClimateData = (markdown: string): ClimateData[] => {
  const data: ClimateData[] = [];
  try {
    const lines = markdown.split('\n');
    let tableStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('|') && lines[i].toLowerCase().includes('destino') && lines[i].toLowerCase().includes('clima')) {
        tableStartIndex = i;
        break;
      }
    }

    if (tableStartIndex !== -1) {
      const headerCells = lines[tableStartIndex].split('|').map(c => c.trim()).filter(c => c);
      const destIndex = headerCells.findIndex(h => h.toLowerCase().includes('destino'));
      const climateIndex = headerCells.findIndex(h => h.toLowerCase().includes('clima'));

      if (destIndex !== -1 && climateIndex !== -1) {
        for (let i = tableStartIndex + 2; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line.startsWith('|')) break;

          const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          
          if (cells[destIndex] && cells[climateIndex]) {
            const climateText = cells[climateIndex];
            let risk: 'low' | 'medium' | 'high' = 'low';
            const lowerText = climateText.toLowerCase();
            if (lowerText.includes('risco alto') || lowerText.includes('furacão') || lowerText.includes('tempestade') || lowerText.includes('extremo')) {
              risk = 'high';
            } else if (lowerText.includes('risco médio') || lowerText.includes('atenção') || lowerText.includes('chuva frequente')) {
              risk = 'medium';
            }
            const tempMatch = climateText.match(/(\d+)(?:°|º)/);
            const temperature = tempMatch ? `${tempMatch[1]}°C` : undefined;

            data.push({
              destination: cells[destIndex].replace(/\*\*/g, ''),
              climateInfo: climateText,
              riskLevel: risk,
              temperature
            });
          }
        }
      }
    }
  } catch (e) { console.error("Failed to parse climate data", e); }
  return data;
};

// Helper to extract destination guides and clean markdown
const extractGuidesAndCleanReport = (markdown: string): { cleanReport: string, guides: DestinationGuide[] } => {
    const guides: DestinationGuide[] = [];
    const guideRegex = /## Guia: (.*?)\n([\s\S]*?)(?=(## Guia:|## |$))/g;
    
    let match;
    let cleanReport = markdown;

    // Use a temp string to remove matches without messing up regex indices if we replaced in place (though replace w/ regex works too)
    // Actually, simple replace is safer to get clean text.
    cleanReport = markdown.replace(guideRegex, '');

    // Reset regex index to capture groups
    while ((match = guideRegex.exec(markdown)) !== null) {
        guides.push({
            destination: match[1].trim(),
            content: match[2].trim()
        });
    }

    return { cleanReport, guides };
}


const BudgetWarning: React.FC<{ userBudget: number, estimatedCost: number }> = ({ userBudget, estimatedCost }) => {
    if (userBudget <= 0 || estimatedCost <= userBudget * 1.1) return null;

    return (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-lg shadow-sm">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <AlertIcon />
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">Atenção ao Orçamento</h3>
                    <div className="mt-2 text-sm text-amber-700">
                        <p>
                            O custo estimado no relatório (aprox. <strong>R$ {estimatedCost.toLocaleString('pt-BR')}</strong>) 
                            excede o seu orçamento alvo de <strong>R$ {userBudget.toLocaleString('pt-BR')}</strong>.
                        </p>
                        <p className="mt-1">
                            Considere ajustar as datas, reduzir a categoria da hospedagem ou optar por voos com escalas para reduzir os custos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FlightDashboard: React.FC<{ data: FlightDeal[] }> = ({ data }) => {
    if (data.length === 0) return null;

    return (
        <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                   <div className="text-blue-600">
                       <AirplaneIcon />
                   </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Opções de Voo</h3>
                    <p className="text-sm text-gray-500">Comparativo de tarifas e milhas encontrado</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.map((deal, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Destino</p>
                                    <h4 className="text-lg font-bold text-gray-900">{deal.destination}</h4>
                                </div>
                                <div className="text-right">
                                     <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Origem</p>
                                     <p className="text-sm font-medium text-gray-700">{deal.origin}</p>
                                </div>
                            </div>
                            
                            <hr className="border-dashed border-gray-200 my-3"/>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Melhor Preço (Cash)</p>
                                    <p className="font-bold text-gray-900 text-lg">{deal.priceCash}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Estimativa Milhas</p>
                                    <p className="font-medium text-indigo-600">{deal.priceMiles}</p>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {deal.duration}
                            </div>
                        </div>

                        <a 
                            href={deal.bookingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-2 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
                        >
                            Ver no Google Flights
                            <ExternalLinkIcon />
                        </a>
                    </div>
                ))}
            </div>
        </div>
    )
}

const ClimateHeatmap: React.FC<{ data: ClimateData[] }> = ({ data }) => {
  if (data.length === 0) return null;

  const getRiskStyles = (level: string) => {
    switch (level) {
      case 'high': 
        return {
            container: 'bg-red-50 border-red-200 hover:border-red-300 hover:shadow-lg hover:shadow-red-100/50',
            text: 'text-red-900',
            bar: 'bg-red-500',
            badge: 'bg-white text-red-700 border-red-100',
            iconColor: 'text-red-500',
            label: 'Risco Elevado'
        };
      case 'medium': 
        return {
            container: 'bg-orange-50 border-orange-200 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100/50',
            text: 'text-orange-900',
            bar: 'bg-orange-500',
            badge: 'bg-white text-orange-700 border-orange-100',
            iconColor: 'text-orange-500',
            label: 'Risco Moderado'
        };
      case 'low': 
      default: 
        return {
            container: 'bg-emerald-50 border-emerald-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/50',
            text: 'text-emerald-900',
            bar: 'bg-emerald-500',
            badge: 'bg-white text-emerald-700 border-emerald-100',
            iconColor: 'text-emerald-500',
            label: 'Condições Favoráveis'
        };
    }
  };

  return (
    <div className="mb-10">
       <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-800">Radar Climático & Riscos</h3>
                <p className="text-sm text-gray-500">Análise de condições meteorológicas para o período</p>
            </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((item, idx) => {
          const styles = getRiskStyles(item.riskLevel);
          return (
            <div
              key={idx}
              className={`relative rounded-xl border p-5 transition-all duration-300 transform hover:-translate-y-1 ${styles.container}`}
            >
              <div className="flex justify-between items-start mb-3">
                  <h4 className={`font-bold text-lg ${styles.text}`}>{item.destination}</h4>
                  {item.temperature && (
                      <span className={`px-2.5 py-1 rounded-md text-sm font-bold shadow-sm border ${styles.badge}`}>
                          {item.temperature}
                      </span>
                  )}
              </div>
              
              <div className="flex items-start gap-3 mb-4 min-h-[3rem]">
                 <div className={`mt-0.5 flex-shrink-0 ${styles.iconColor}`}>
                    {item.riskLevel === 'high' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    ) : item.riskLevel === 'medium' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                 </div>
                 <p className={`text-sm font-medium leading-snug opacity-90 ${styles.text}`}>
                    {item.climateInfo}
                 </p>
              </div>

              {/* Visual Indicator Bar */}
              <div className="w-full bg-white/40 h-2 rounded-full overflow-hidden mt-auto">
                  <div 
                      className={`h-full rounded-full ${styles.bar}`} 
                      style={{ width: item.riskLevel === 'high' ? '100%' : item.riskLevel === 'medium' ? '66%' : '33%' }}
                  ></div>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                 <span className={`text-[10px] font-bold uppercase tracking-widest opacity-70 ${styles.text}`}>Nível de Risco</span>
                 <span className={`text-xs font-bold uppercase ${styles.text}`}>
                    {styles.label}
                 </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DestinationAccordion: React.FC<{ guide: DestinationGuide }> = ({ guide }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Simple parser just for the accordion content to render bold and lists
    const contentElements = useMemo(() => parseMarkdown(guide.content), [guide.content]);

    return (
        <div className="mb-4 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors focus:outline-none"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                        <MapIcon />
                    </div>
                    <div className="text-left">
                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Guia Completo</span>
                        <h4 className="text-lg font-bold text-gray-800">{guide.destination}</h4>
                    </div>
                </div>
                <div className={`transform transition-transform duration-300 text-gray-400 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDownIcon />
                </div>
            </button>
            <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-6 pt-0 border-t border-gray-100 bg-gray-50/50">
                     <div className="prose prose-indigo prose-sm max-w-none text-gray-600">
                        {contentElements}
                     </div>
                </div>
            </div>
        </div>
    );
};


const parseMarkdown = (markdown: string) => {
  const lines = markdown.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableHeader: string[] = [];
  const tableRows: string[][] = [];

  const flushTable = () => {
    if (tableHeader.length > 0 && tableRows.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto my-4 rounded-lg shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {tableHeader.map((header, i) => (
                  <th key={i} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header.trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableRows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  {row.map((cell, j) => (
                    <td key={j} className="px-6 py-4 whitespace-normal text-sm text-gray-700 max-w-xs">{cell.trim()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    inTable = false;
    tableHeader = [];
    tableRows.splice(0, tableRows.length);
  };

  lines.forEach((line, index) => {
    // Headers
    if (line.startsWith('# ')) {
      flushTable();
      elements.push(<h1 key={index} className="text-3xl font-bold mt-8 mb-4 pb-2 border-b border-gray-200 text-indigo-900">{line.substring(2)}</h1>);
    } else if (line.startsWith('## ')) {
      flushTable();
      elements.push(<h2 key={index} className="text-2xl font-bold mt-6 mb-3 text-gray-800">{line.substring(3)}</h2>);
    } else if (line.startsWith('### ')) {
      flushTable();
      elements.push(<h3 key={index} className="text-xl font-semibold mt-5 mb-2 text-gray-700">{line.substring(4)}</h3>);
    }
    // Lists
    else if (line.startsWith('* ') || line.startsWith('- ')) {
      flushTable();
      elements.push(
        <li key={index} className="ml-5 list-disc text-gray-700 mb-1 pl-1 marker:text-indigo-400">
            {line.substring(2).replace(/\*\*(.*?)\*\*/g, (match, p1) => `<strong class="text-gray-900">${p1}</strong>`).split(/<|>/).map((chunk, i) => {
                 if (chunk.startsWith('strong class')) return null; // Simple parser limitations, relying on plain text mostly or simple React replacement below
                 return chunk; 
            })}
             {/* Simple bold parser for list items */}
             {line.substring(2).split(/(\*\*.*?\*\*)/).map((part, i) => 
                part.startsWith('**') ? <strong key={i} className="text-gray-900">{part.slice(2, -2)}</strong> : part
             )}
        </li>
      );
    }
    // Tables
    else if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.trim().slice(1, -1).split('|');
      if (!inTable) {
        // Check if it's a separator line |---|---|
        if (!line.includes('---')) {
            inTable = true;
            tableHeader = cells;
        }
      } else if (!line.includes('---')) {
        tableRows.push(cells);
      }
    }
    // Normal text
    else if (line.trim() !== '') {
      if (inTable) flushTable();
      
      const paragraphContent = line.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-gray-900 font-bold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i} className="text-gray-600">{part.slice(1, -1)}</em>;
        }
        return part;
      });
      elements.push(<p key={index} className="my-3 text-gray-600 leading-relaxed">{paragraphContent}</p>);
    }
  });

  flushTable();
  return elements;
};

const ReportDisplay: React.FC<ReportDisplayProps> = ({ data, preferences }) => {
  const { text: reportRaw, sources } = data;
  
  // Extract specific sections and clean the main report text
  const { cleanReport, guides } = useMemo(() => extractGuidesAndCleanReport(reportRaw), [reportRaw]);
  
  const reportElements = useMemo(() => parseMarkdown(cleanReport), [cleanReport]);
  const climateData = useMemo(() => extractClimateData(cleanReport), [cleanReport]);
  const flightData = useMemo(() => extractFlightData(cleanReport), [cleanReport]);
  
  // Budget Comparison
  const userBudget = useMemo(() => parseCurrency(preferences.orcamento_brl), [preferences.orcamento_brl]);
  const estimatedTotal = useMemo(() => extractEstimatedTotal(cleanReport), [cleanReport]);
  
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-10 max-w-none border border-gray-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8 border-b border-gray-100 pb-6">
        <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200">
            <div className="text-white">
                 <SparklesIcon />
            </div>
        </div>
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Relatório de Viagem</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">Planejamento personalizado gerado por IA.</p>
        </div>
      </div>

      {/* Budget Warning Alert */}
      {estimatedTotal !== null && (
          <BudgetWarning userBudget={userBudget} estimatedCost={estimatedTotal} />
      )}

      {/* Flight Dashboard */}
      <FlightDashboard data={flightData} />

      {/* Interactive Climate Heatmap */}
      <ClimateHeatmap data={climateData} />
      
      {/* Expanded Destination Guides */}
      {guides.length > 0 && (
          <div className="mb-10">
               <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Explorar Destinos
               </h3>
               {guides.map((guide, idx) => (
                   <DestinationAccordion key={idx} guide={guide} />
               ))}
          </div>
      )}

      {/* Main Content */}
      <div className="prose prose-indigo prose-lg text-gray-600">
        {reportElements}
      </div>

      {/* Sources Section */}
      {sources.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Fontes Consultadas
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {sources.map((source, idx) => (
              <li key={idx} className="truncate">
                <a 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-2 truncate transition-colors"
                >
                  <ExternalLinkIcon />
                  <span className="truncate">{source.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReportDisplay;