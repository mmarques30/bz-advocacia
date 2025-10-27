import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  AnalyticsFilters, 
  ConversionAnalytics, 
  ChannelPerformance,
  ConversionFunnelStage,
  StageTime,
  ConversionByOrigin,
  ConversionEvolution,
  ChannelEvolution,
  AutoInsight,
  ESTAGIO_ORDER,
  ESTAGIO_LABELS
} from "@/types/analytics";
import { subMonths, format, differenceInDays, startOfMonth, endOfMonth } from "date-fns";
import { LeadOrigem } from "@/types/leads";

interface Lead {
  id: string;
  estagio: string;
  origem: LeadOrigem;
  created_at: string;
  data_ultima_atividade: string;
  valor_proposta: number | null;
}

function processConversionData(leads: Lead[], previousLeads: Lead[]): ConversionAnalytics {
  // 1. Calcular funil detalhado
  const stageCounts: Record<string, number> = {};
  const stages = ['novo', 'contato_inicial', 'em_analise', 'proposta_enviada', 'fechado'];
  
  stages.forEach(stage => {
    stageCounts[stage] = leads.filter(l => {
      const currentOrder = ESTAGIO_ORDER[l.estagio];
      const stageOrder = ESTAGIO_ORDER[stage];
      return currentOrder >= stageOrder;
    }).length;
  });

  const funnelDetalhado: ConversionFunnelStage[] = stages.map((stage, index) => {
    const count = stageCounts[stage];
    const total = stageCounts['novo'] || 1;
    const nextStage = stages[index + 1];
    const nextCount = nextStage ? stageCounts[nextStage] : count;
    const perdido = count - nextCount;
    const taxaConversao = nextStage ? (nextCount / count) * 100 : 100;

    return {
      estagio: ESTAGIO_LABELS[stage],
      count,
      percentage: (count / total) * 100,
      perdido,
      taxaConversao,
    };
  });

  // 2. Identificar gargalo
  const gargalo = funnelDetalhado.reduce((prev, curr) => 
    curr.taxaConversao < prev.taxaConversao ? curr : prev
  );

  // 3. Taxa de conversão geral
  const totalLeads = stageCounts['novo'] || 0;
  const convertidos = stageCounts['fechado'] || 0;
  const taxaConversaoGeral = totalLeads > 0 ? (convertidos / totalLeads) * 100 : 0;

  // 4. Comparação com período anterior
  const previousConvertidos = previousLeads.filter(l => l.estagio === 'fechado').length;
  const previousTotal = previousLeads.length;
  const previousTaxa = previousTotal > 0 ? (previousConvertidos / previousTotal) * 100 : 0;
  const variacao = previousTaxa > 0 ? ((taxaConversaoGeral - previousTaxa) / previousTaxa) * 100 : 0;

  // 5. Tempo médio por estágio (estimativa)
  const tempoMedioPorEstagio: StageTime[] = stages.map(stage => {
    const leadsInStage = leads.filter(l => l.estagio === stage);
    const tempos = leadsInStage.map(l => 
      differenceInDays(new Date(l.data_ultima_atividade), new Date(l.created_at))
    );
    
    return {
      estagio: ESTAGIO_LABELS[stage],
      tempoMedioDias: tempos.length > 0 ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0,
      minDias: tempos.length > 0 ? Math.min(...tempos) : 0,
      maxDias: tempos.length > 0 ? Math.max(...tempos) : 0,
    };
  });

  // 6. Conversão por origem
  const origens = Array.from(new Set(leads.map(l => l.origem))) as LeadOrigem[];
  const conversaoPorOrigem: ConversionByOrigin[] = origens.map(origem => {
    const leadsOrigem = leads.filter(l => l.origem === origem);
    const convertidosOrigem = leadsOrigem.filter(l => l.estagio === 'fechado').length;
    
    return {
      origem,
      totalLeads: leadsOrigem.length,
      convertidos: convertidosOrigem,
      taxaConversao: leadsOrigem.length > 0 ? (convertidosOrigem / leadsOrigem.length) * 100 : 0,
    };
  });

  // 7. Evolução da taxa de conversão (últimos 12 meses - placeholder)
  const evolucaoTaxaConversao: ConversionEvolution[] = [];

  return {
    taxaConversaoGeral,
    variacao,
    funnelDetalhado,
    tempoMedioPorEstagio,
    conversaoPorOrigem,
    evolucaoTaxaConversao,
    gargalo: {
      estagio: gargalo.estagio,
      taxaPerdida: 100 - gargalo.taxaConversao,
    },
  };
}

function processChannelData(leads: Lead[]): ChannelPerformance[] {
  const origens = Array.from(new Set(leads.map(l => l.origem))) as LeadOrigem[];
  
  return origens.map(origem => {
    const leadsOrigem = leads.filter(l => l.origem === origem);
    const convertidos = leadsOrigem.filter(l => l.estagio === 'fechado');
    const valoresPropostas = convertidos
      .map(l => l.valor_proposta)
      .filter((v): v is number => v !== null);
    
    const tempos = convertidos.map(l => 
      differenceInDays(new Date(l.data_ultima_atividade), new Date(l.created_at))
    );

    return {
      origem,
      totalLeads: leadsOrigem.length,
      taxaConversao: leadsOrigem.length > 0 ? (convertidos.length / leadsOrigem.length) * 100 : 0,
      ticketMedio: valoresPropostas.length > 0 
        ? valoresPropostas.reduce((a, b) => a + b, 0) / valoresPropostas.length 
        : 0,
      tempoMedioConversao: tempos.length > 0 
        ? tempos.reduce((a, b) => a + b, 0) / tempos.length 
        : 0,
      receitaTotal: valoresPropostas.reduce((a, b) => a + b, 0),
    };
  });
}

export function useConversionAnalytics(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['conversion-analytics', filters],
    queryFn: async () => {
      const { startDate, endDate } = filters;
      
      const { data: leads, error } = await supabase
        .from('contact_submissions')
        .select('id, estagio, origem, created_at, data_ultima_atividade, valor_proposta')
        .gte('created_at', startDate?.toISOString())
        .lte('created_at', endDate?.toISOString());

      if (error) throw error;

      // Buscar período anterior para comparação
      const previousStart = subMonths(startDate || new Date(), 1);
      const previousEnd = subMonths(endDate || new Date(), 1);
      
      const { data: previousLeads } = await supabase
        .from('contact_submissions')
        .select('id, estagio, origem, created_at, data_ultima_atividade, valor_proposta')
        .gte('created_at', previousStart.toISOString())
        .lte('created_at', previousEnd.toISOString());

      return processConversionData(leads as Lead[], previousLeads as Lead[] || []);
    },
  });
}

export function useChannelPerformance(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['channel-performance', filters],
    queryFn: async () => {
      const { startDate, endDate } = filters;
      
      const { data: leads, error } = await supabase
        .from('contact_submissions')
        .select('id, origem, estagio, valor_proposta, created_at, data_ultima_atividade')
        .gte('created_at', startDate?.toISOString())
        .lte('created_at', endDate?.toISOString());

      if (error) throw error;

      return processChannelData(leads as Lead[]);
    },
  });
}

export function useChannelEvolution(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['channel-evolution', filters],
    queryFn: async () => {
      const endDate = filters.endDate || new Date();
      const startDate = subMonths(endDate, 6);
      
      const { data: leads, error } = await supabase
        .from('contact_submissions')
        .select('origem, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Agrupar por mês e origem
      const monthlyData: Record<string, ChannelEvolution> = {};
      
      leads?.forEach((lead: any) => {
        const mes = format(new Date(lead.created_at), 'MMM/yy');
        if (!monthlyData[mes]) {
          monthlyData[mes] = {
            mes,
            google: 0,
            meta: 0,
            indicacao: 0,
            site: 0,
            outro: 0,
          };
        }
        
        const origem = lead.origem as LeadOrigem;
        if (origem === 'google') monthlyData[mes].google++;
        else if (origem === 'meta') monthlyData[mes].meta++;
        else if (origem === 'indicacao') monthlyData[mes].indicacao++;
        else if (origem === 'site') monthlyData[mes].site++;
        else monthlyData[mes].outro++;
      });

      return Object.values(monthlyData);
    },
  });
}

export function useAutoInsights(channelData?: ChannelPerformance[]) {
  return useQuery({
    queryKey: ['auto-insights', channelData],
    queryFn: async () => {
      if (!channelData || channelData.length === 0) return [];

      const insights: AutoInsight[] = [];

      // 1. Melhor taxa de conversão
      const bestConversion = channelData.reduce((prev, curr) => 
        curr.taxaConversao > prev.taxaConversao ? curr : prev
      );
      insights.push({
        id: 'best-conversion',
        tipo: 'best_conversion',
        valor: `${bestConversion.taxaConversao.toFixed(1)}%`,
        descricao: 'taxa de conversão',
        canal: bestConversion.origem,
      });

      // 2. Mais leads
      const mostLeads = channelData.reduce((prev, curr) => 
        curr.totalLeads > prev.totalLeads ? curr : prev
      );
      insights.push({
        id: 'most-leads',
        tipo: 'most_leads',
        valor: `${mostLeads.totalLeads}`,
        descricao: 'leads no período',
        canal: mostLeads.origem,
      });

      // 3. Maior ticket médio
      const highestTicket = channelData.reduce((prev, curr) => 
        curr.ticketMedio > prev.ticketMedio ? curr : prev
      );
      insights.push({
        id: 'highest-ticket',
        tipo: 'highest_ticket',
        valor: `R$ ${highestTicket.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        descricao: 'ticket médio',
        canal: highestTicket.origem,
      });

      // 4. Conversão mais rápida (ou receita total como fallback)
      const validChannels = channelData.filter(c => c.tempoMedioConversao > 0);
      if (validChannels.length > 0) {
        const fastest = validChannels.reduce((prev, curr) => 
          curr.tempoMedioConversao < prev.tempoMedioConversao ? curr : prev
        );
        insights.push({
          id: 'fastest-conversion',
          tipo: 'fastest_conversion',
          valor: `${Math.round(fastest.tempoMedioConversao)}`,
          descricao: 'dias em média',
          canal: fastest.origem,
        });
      } else {
        // Fallback: mostrar maior receita total
        const highestRevenue = channelData.reduce((prev, curr) => 
          curr.receitaTotal > prev.receitaTotal ? curr : prev
        );
        insights.push({
          id: 'highest-revenue',
          tipo: 'highest_ticket',
          valor: `R$ ${highestRevenue.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
          descricao: 'receita total',
          canal: highestRevenue.origem,
        });
      }

      return insights;
    },
    enabled: !!channelData && channelData.length > 0,
  });
}
