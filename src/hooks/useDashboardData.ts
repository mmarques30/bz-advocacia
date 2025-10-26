import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardFilters } from '@/types/dashboard';
import { mockKPIs, mockFunnelData, mockRevenueData, mockLeadsEvolution, mockAlerts, mockActivities } from '@/lib/mockData';

export function useKPIs(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['kpis', filters],
    queryFn: async () => {
      // TODO: Implementar query real quando houver dados
      return mockKPIs;
    },
  });
}

export function useConversionFunnel(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['funnel', filters],
    queryFn: async () => {
      // TODO: Implementar query real
      return mockFunnelData;
    },
  });
}

export function useLeadsEvolution(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['leads-evolution', filters],
    queryFn: async () => {
      // TODO: Implementar query real
      return mockLeadsEvolution;
    },
  });
}

export function useRevenue(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['revenue', filters],
    queryFn: async () => {
      // TODO: Implementar query real
      return mockRevenueData;
    },
  });
}

export function useAlerts(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: async () => {
      // TODO: Implementar queries reais para alertas
      return mockAlerts;
    },
  });
}

export function useRecentActivities(limit: number = 10) {
  return useQuery({
    queryKey: ['activities', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atividades')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching activities:', error);
        return mockActivities;
      }

      if (!data || data.length === 0) {
        return mockActivities;
      }

      return data.map((activity) => ({
        id: activity.id,
        usuario: 'Usuário',
        tipo: activity.tipo,
        descricao: activity.descricao,
        timestamp: new Date(activity.created_at),
      }));
    },
  });
}
