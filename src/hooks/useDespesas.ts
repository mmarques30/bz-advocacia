import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { 
  Despesa, 
  DespesasFilters, 
  KPIsDespesas, 
  DespesaPorCategoria,
  StatusDespesa 
} from "@/types/financeiro";
import { startOfMonth, endOfMonth, isPast } from "date-fns";

// Listar despesas com filtros
export function useDespesas(filters?: DespesasFilters) {
  return useQuery({
    queryKey: ['despesas', filters],
    queryFn: async () => {
      let query = supabase
        .from('despesas')
        .select(`
          *,
          processo:processos(id, numero_processo, tipo)
        `)
        .order('data', { ascending: false });

      if (filters?.search) {
        query = query.ilike('descricao', `%${filters.search}%`);
      }

      if (filters?.categoria && filters.categoria.length > 0) {
        query = query.in('categoria', filters.categoria);
      }

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.processo_id) {
        query = query.eq('processo_id', filters.processo_id);
      }

      if (filters?.data_inicio) {
        query = query.gte('data', filters.data_inicio.toISOString().split('T')[0]);
      }

      if (filters?.data_fim) {
        query = query.lte('data', filters.data_fim.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calcular status dinâmico (atrasado)
      const despesasComStatus = (data || []).map(despesa => {
        const dataVencimento = new Date(despesa.data);
        const isAtrasado = despesa.status === 'pendente' && isPast(dataVencimento);
        
        return {
          ...despesa,
          status: isAtrasado ? 'atrasado' as StatusDespesa : despesa.status as StatusDespesa,
        };
      });

      return despesasComStatus as Despesa[];
    },
  });
}

// Buscar detalhes de uma despesa
export function useDespesa(despesaId: string | null) {
  return useQuery({
    queryKey: ['despesa', despesaId],
    queryFn: async () => {
      if (!despesaId) return null;

      const { data, error } = await supabase
        .from('despesas')
        .select(`
          *,
          processo:processos(id, numero_processo, tipo)
        `)
        .eq('id', despesaId)
        .single();

      if (error) throw error;

      return data as Despesa;
    },
    enabled: !!despesaId,
  });
}

// Criar despesa
export function useCreateDespesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (despesa: Omit<Despesa, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('despesas')
        .insert({
          ...despesa,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.invalidateQueries({ queryKey: ['kpis-despesas'] });
      queryClient.invalidateQueries({ queryKey: ['despesas-por-categoria'] });
      toast.success('Despesa cadastrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cadastrar despesa: ' + error.message);
    },
  });
}

// Atualizar despesa
export function useUpdateDespesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...despesa }: Partial<Despesa> & { id: string }) => {
      const { data, error } = await supabase
        .from('despesas')
        .update(despesa)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.invalidateQueries({ queryKey: ['despesa'] });
      queryClient.invalidateQueries({ queryKey: ['kpis-despesas'] });
      queryClient.invalidateQueries({ queryKey: ['despesas-por-categoria'] });
      toast.success('Despesa atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar despesa: ' + error.message);
    },
  });
}

// Excluir despesa
export function useDeleteDespesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (despesaId: string) => {
      const { error } = await supabase
        .from('despesas')
        .delete()
        .eq('id', despesaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.invalidateQueries({ queryKey: ['kpis-despesas'] });
      queryClient.invalidateQueries({ queryKey: ['despesas-por-categoria'] });
      toast.success('Despesa excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir despesa: ' + error.message);
    },
  });
}

// KPIs de Despesas
export function useKPIsDespesas() {
  return useQuery({
    queryKey: ['kpis-despesas'],
    queryFn: async () => {
      const inicio = startOfMonth(new Date()).toISOString().split('T')[0];
      const fim = endOfMonth(new Date()).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('despesas')
        .select('valor, status, data')
        .gte('data', inicio)
        .lte('data', fim);

      if (error) throw error;

      const despesas = data || [];
      const hoje = new Date();

      const total_mes = despesas.reduce((sum, d) => sum + Number(d.valor), 0);
      const total_pendente = despesas
        .filter(d => d.status === 'pendente')
        .reduce((sum, d) => sum + Number(d.valor), 0);
      
      const total_atrasado = despesas
        .filter(d => d.status === 'pendente' && isPast(new Date(d.data)))
        .reduce((sum, d) => sum + Number(d.valor), 0);
      
      const total_pago_mes = despesas
        .filter(d => d.status === 'pago')
        .reduce((sum, d) => sum + Number(d.valor), 0);

      return {
        total_mes,
        total_pendente,
        total_atrasado,
        total_pago_mes,
      } as KPIsDespesas;
    },
  });
}

// Despesas por categoria
export function useDespesasPorCategoria() {
  return useQuery({
    queryKey: ['despesas-por-categoria'],
    queryFn: async () => {
      const inicio = startOfMonth(new Date()).toISOString().split('T')[0];
      const fim = endOfMonth(new Date()).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('despesas')
        .select('categoria, valor')
        .gte('data', inicio)
        .lte('data', fim);

      if (error) throw error;

      const despesas = data || [];
      const total = despesas.reduce((sum, d) => sum + Number(d.valor), 0);

      // Agrupar por categoria
      const porCategoria = despesas.reduce((acc, d) => {
        const cat = d.categoria;
        if (!acc[cat]) {
          acc[cat] = { total: 0, quantidade: 0 };
        }
        acc[cat].total += Number(d.valor);
        acc[cat].quantidade += 1;
        return acc;
      }, {} as Record<string, { total: number; quantidade: number }>);

      // Converter para array com percentual
      return Object.entries(porCategoria).map(([categoria, { total: totalCat, quantidade }]) => ({
        categoria: categoria as any,
        total: totalCat,
        quantidade,
        percentual: total > 0 ? (totalCat / total) * 100 : 0,
      })) as DespesaPorCategoria[];
    },
  });
}

// Despesas recentes (últimas 5)
export function useDespesasRecentes() {
  return useQuery({
    queryKey: ['despesas-recentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('despesas')
        .select('*')
        .order('data', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []) as Despesa[];
    },
  });
}
