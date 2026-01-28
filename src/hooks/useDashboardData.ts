import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardFilters, KPI, FunnelStage, RevenueData, LeadsEvolutionData, Alert, Activity } from '@/types/dashboard';
import { startOfMonth, endOfMonth, subMonths, format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function useKPIs(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['kpis', filters],
    queryFn: async (): Promise<KPI> => {
      const now = new Date();
      const startDate = filters.startDate?.toISOString() || startOfMonth(now).toISOString();
      const endDate = filters.endDate?.toISOString() || endOfMonth(now).toISOString();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Total de leads no período (excluir clientes importados)
      const { count: totalLeads } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .neq('como_conheceu', 'importacao')
        .neq('estagio', 'fechado')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Leads convertidos (estagio = fechado, excluir importados)
      const { count: convertedLeads } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('estagio', 'fechado')
        .neq('como_conheceu', 'importacao')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Novos clientes no período (estagio fechado OU importados no período)
      const { count: novosClientes } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('estagio', 'fechado')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Processos ativos (status = em_andamento)
      const { count: processosAtivos } = await supabase
        .from('processos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'em_andamento');

      // Prazos próximos (próximos 7 dias)
      const { count: prazosProximos } = await supabase
        .from('processos_prazos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente')
        .gte('data_prazo', now.toISOString().split('T')[0])
        .lte('data_prazo', sevenDaysFromNow.toISOString().split('T')[0]);

      const taxaConversao = totalLeads && totalLeads > 0 
        ? ((convertedLeads || 0) / totalLeads) * 100 
        : 0;

      return {
        totalLeads: totalLeads || 0,
        taxaConversao: Math.round(taxaConversao * 10) / 10,
        novosClientes: novosClientes || 0,
        processosAtivos: processosAtivos || 0,
        prazosProximos: prazosProximos || 0,
      };
    },
  });
}

export function useConversionFunnel(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['funnel', filters],
    queryFn: async (): Promise<FunnelStage[]> => {
      const startDate = filters.startDate?.toISOString();
      const endDate = filters.endDate?.toISOString();

      // Filtrar apenas leads reais (excluir clientes importados)
      let query = supabase
        .from('contact_submissions')
        .select('estagio')
        .neq('como_conheceu', 'importacao');
      
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data, error } = await query;

      if (error || !data) return [];

      const stageCounts: Record<string, number> = {};
      data.forEach((lead) => {
        const stage = lead.estagio || 'novo';
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      });

      const total = data.length;
      const stages = ['novo', 'contato', 'analise', 'proposta', 'fechado'];
      const stageLabels: Record<string, string> = {
        novo: 'Novo',
        contato: 'Contato',
        analise: 'Análise',
        proposta: 'Proposta',
        fechado: 'Fechado',
      };

      return stages.map((stage) => ({
        estagio: stageLabels[stage] || stage,
        count: stageCounts[stage] || 0,
        percentage: total > 0 ? Math.round(((stageCounts[stage] || 0) / total) * 100) : 0,
      }));
    },
  });
}

export function useLeadsEvolution(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['leads-evolution', filters],
    queryFn: async (): Promise<LeadsEvolutionData[]> => {
      const now = new Date();
      const months: LeadsEvolutionData[] = [];

      for (let i = 5; i >= 0; i--) {
        const currentMonth = subMonths(now, i);
        const previousMonth = subMonths(now, i + 12);
        
        const startCurrent = startOfMonth(currentMonth);
        const endCurrent = endOfMonth(currentMonth);
        const startPrevious = startOfMonth(previousMonth);
        const endPrevious = endOfMonth(previousMonth);

        // Filtrar apenas leads reais (excluir clientes importados)
        const { count: atual } = await supabase
          .from('contact_submissions')
          .select('*', { count: 'exact', head: true })
          .neq('como_conheceu', 'importacao')
          .gte('created_at', startCurrent.toISOString())
          .lte('created_at', endCurrent.toISOString());

        const { count: anterior } = await supabase
          .from('contact_submissions')
          .select('*', { count: 'exact', head: true })
          .neq('como_conheceu', 'importacao')
          .gte('created_at', startPrevious.toISOString())
          .lte('created_at', endPrevious.toISOString());

        months.push({
          mes: format(currentMonth, 'MMM', { locale: ptBR }),
          atual: atual || 0,
          anterior: anterior || 0,
        });
      }

      return months;
    },
  });
}

export function useRevenue(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['revenue', filters],
    queryFn: async (): Promise<RevenueData[]> => {
      const now = new Date();
      const months: RevenueData[] = [];

      for (let i = 5; i >= 0; i--) {
        const month = subMonths(now, i);
        const mesNum = month.getMonth() + 1;
        const anoNum = month.getFullYear();

        // Buscar receitas de transacoes_financeiras
        const { data: transacoesData } = await supabase
          .from('transacoes_financeiras')
          .select('valor')
          .eq('tipo_codigo', 'receita')
          .eq('mes', mesNum)
          .eq('ano', anoNum);

        // Buscar também de parcelas pagas como fallback
        const start = startOfMonth(month);
        const end = endOfMonth(month);
        const { data: parcelasData } = await supabase
          .from('parcelas_financeiras')
          .select('valor_pago')
          .eq('status', 'pago')
          .gte('data_pagamento', start.toISOString())
          .lte('data_pagamento', end.toISOString());

        // Buscar meta do mês
        const { data: metaData } = await supabase
          .from('metas_mensais')
          .select('valor')
          .eq('mes', mesNum)
          .eq('ano', anoNum)
          .single();

        const receitaTransacoes = transacoesData?.reduce((acc, t) => acc + (Number(t.valor) || 0), 0) || 0;
        const receitaParcelas = parcelasData?.reduce((acc, p) => acc + (Number(p.valor_pago) || 0), 0) || 0;
        
        // Usar o maior valor entre as duas fontes
        const receita = Math.max(receitaTransacoes, receitaParcelas);

        months.push({
          mes: format(month, 'MMM', { locale: ptBR }),
          receita,
          meta: metaData?.valor ? Number(metaData.valor) : 100000,
        });
      }

      return months;
    },
  });
}

export function useAlerts(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: async (): Promise<Alert[]> => {
      const alerts: Alert[] = [];
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Leads parados há mais de 7 dias
      const { count: leadsParados } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .lt('data_ultima_atividade', sevenDaysAgo.toISOString())
        .not('status', 'eq', 'cliente')
        .not('status', 'eq', 'perdido');

      if (leadsParados && leadsParados > 0) {
        alerts.push({
          id: 'leads-parados',
          tipo: 'lead_parado',
          titulo: `${leadsParados} leads sem atividade`,
          descricao: 'Leads parados há mais de 7 dias',
          severity: 'warning',
        });
      }

      // Prazos vencendo nos próximos 7 dias
      const { count: prazosProximos } = await supabase
        .from('processos_prazos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente')
        .gte('data_prazo', now.toISOString())
        .lte('data_prazo', sevenDaysFromNow.toISOString());

      if (prazosProximos && prazosProximos > 0) {
        alerts.push({
          id: 'prazos-proximos',
          tipo: 'prazo_vencendo',
          titulo: `${prazosProximos} prazos próximos`,
          descricao: 'Vencendo nos próximos 7 dias',
          severity: 'error',
        });
      }

      // Parcelas atrasadas
      const { data: parcelasAtrasadas } = await supabase
        .from('parcelas_financeiras')
        .select('valor')
        .eq('status', 'pendente')
        .lt('data_vencimento', now.toISOString());

      if (parcelasAtrasadas && parcelasAtrasadas.length > 0) {
        const totalAtrasado = parcelasAtrasadas.reduce((acc, p) => acc + (p.valor || 0), 0);
        alerts.push({
          id: 'parcelas-atrasadas',
          tipo: 'parcela_atrasada',
          titulo: `${parcelasAtrasadas.length} parcelas atrasadas`,
          descricao: `Total de R$ ${totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          severity: 'error',
        });
      }

      // Processos sem atualização há 30 dias
      const { count: processosSemUpdate } = await supabase
        .from('processos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo')
        .lt('data_ultima_atualizacao', thirtyDaysAgo.toISOString());

      if (processosSemUpdate && processosSemUpdate > 0) {
        alerts.push({
          id: 'processos-sem-update',
          tipo: 'processo_sem_update',
          titulo: `${processosSemUpdate} processos sem atualização`,
          descricao: 'Sem movimentação há mais de 30 dias',
          severity: 'info',
        });
      }

      return alerts;
    },
  });
}

export function useRecentActivities(limit: number = 10) {
  return useQuery({
    queryKey: ['activities', limit],
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await supabase
        .from('atividades')
        .select(`
          *,
          profiles:usuario_id (nome_completo)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching activities:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((activity) => ({
        id: activity.id,
        usuario: (activity.profiles as any)?.nome_completo || 'Sistema',
        tipo: activity.tipo,
        descricao: activity.descricao,
        timestamp: new Date(activity.created_at || new Date()),
      }));
    },
  });
}
