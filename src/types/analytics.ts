import { LeadOrigem } from './leads';
import { DashboardFilters } from './dashboard';

// Análise de Conversão
export interface ConversionAnalytics {
  taxaConversaoGeral: number;
  variacao: number; // comparação com período anterior
  funnelDetalhado: ConversionFunnelStage[];
  tempoMedioPorEstagio: StageTime[];
  conversaoPorOrigem: ConversionByOrigin[];
  evolucaoTaxaConversao: ConversionEvolution[];
  gargalo: {
    estagio: string;
    taxaPerdida: number;
  };
}

export interface ConversionFunnelStage {
  estagio: string;
  count: number;
  percentage: number;
  perdido: number; // quantidade perdida até próximo estágio
  taxaConversao: number; // % que avançou para próximo
}

export interface StageTime {
  estagio: string;
  tempoMedioDias: number;
  minDias: number;
  maxDias: number;
}

export interface ConversionByOrigin {
  origem: LeadOrigem;
  totalLeads: number;
  convertidos: number;
  taxaConversao: number;
}

export interface ConversionEvolution {
  mes: string;
  taxaConversao: number;
}

// Performance por Canal
export interface ChannelPerformance {
  origem: LeadOrigem;
  totalLeads: number;
  taxaConversao: number;
  ticketMedio: number;
  tempoMedioConversao: number; // em dias
  receitaTotal: number;
}

export interface ChannelDistribution {
  origem: LeadOrigem;
  count: number;
  percentage: number;
}

export interface ChannelEvolution {
  mes: string;
  google: number;
  meta: number;
  indicacao: number;
  site: number;
  outro: number;
}

export interface AutoInsight {
  id: string;
  tipo: 'best_conversion' | 'most_leads' | 'highest_ticket' | 'average_time';
  valor: string;
  descricao: string;
  canal?: LeadOrigem;
}

export interface AnalyticsFilters extends DashboardFilters {
  compareWithPrevious?: boolean;
}

// Mapeamento de estágios
export const ESTAGIO_ORDER: Record<string, number> = {
  'novo': 1,
  'contato_inicial': 2,
  'em_analise': 3,
  'proposta_enviada': 4,
  'fechado': 5,
  'perdido': 6,
};

export const ESTAGIO_LABELS: Record<string, string> = {
  'novo': 'Novo',
  'contato_inicial': 'Contato',
  'em_analise': 'Análise',
  'proposta_enviada': 'Proposta',
  'fechado': 'Fechado',
  'perdido': 'Perdido',
};
