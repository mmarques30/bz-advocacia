import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface TransacaoExterna {
  id: string;
  external_id: string | null;
  ano: number;
  mes: number;
  mes_nome: string | null;
  categoria: string;
  subcategoria: string | null;
  tipo: string;
  data_transacao: string;
  descricao: string | null;
  valor: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface TransacoesFilters {
  ano?: number;
  mes?: number;
  categoria?: string;
  subcategoria?: string;
  tipo?: 'receita' | 'despesa';
}

export function useTransacoesExternas(filters?: TransacoesFilters) {
  return useQuery({
    queryKey: ['transacoes-externas', filters],
    queryFn: async () => {
      let query = supabase
        .from('transacoes_externas')
        .select('*')
        .order('data_transacao', { ascending: false });

      if (filters?.ano) {
        query = query.eq('ano', filters.ano);
      }
      if (filters?.mes) {
        query = query.eq('mes', filters.mes);
      }
      if (filters?.categoria) {
        query = query.eq('categoria', filters.categoria);
      }
      if (filters?.subcategoria) {
        query = query.eq('subcategoria', filters.subcategoria);
      }
      if (filters?.tipo) {
        query = query.eq('tipo', filters.tipo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TransacaoExterna[];
    },
  });
}

export function useResumoMensalExterno(ano?: number) {
  return useQuery({
    queryKey: ['resumo-mensal-externo', ano],
    queryFn: async () => {
      let query = supabase
        .from('resumo_mensal_externo')
        .select('*')
        .order('mes', { ascending: true });

      if (ano) {
        query = query.eq('ano', ano);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

export function useResumoAnualExterno() {
  return useQuery({
    queryKey: ['resumo-anual-externo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resumo_anual_externo')
        .select('*')
        .order('ano', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCategoriasExternas() {
  return useQuery({
    queryKey: ['categorias-externas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_externas')
        .select('*');

      if (error) throw error;
      return data;
    },
  });
}

export function useSubcategoriasExternas() {
  return useQuery({
    queryKey: ['subcategorias-externas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcategorias_externas')
        .select('*');

      if (error) throw error;
      return data;
    },
  });
}

export function useKPIsFinanceirosExternos(ano?: number) {
  const currentYear = ano || new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  return useQuery({
    queryKey: ['kpis-financeiros-externos', currentYear],
    queryFn: async () => {
      // Get all transactions for the year
      const { data: transacoes, error } = await supabase
        .from('transacoes_externas')
        .select('*')
        .eq('ano', currentYear);

      if (error) throw error;

      const receitas = transacoes?.filter(t => t.tipo === 'receita') || [];
      const despesas = transacoes?.filter(t => t.tipo === 'despesa') || [];

      const totalReceitas = receitas.reduce((sum, t) => sum + Number(t.valor), 0);
      const totalDespesas = despesas.reduce((sum, t) => sum + Number(t.valor), 0);
      const lucroLiquido = totalReceitas - totalDespesas;
      const margemLucro = totalReceitas > 0 ? (lucroLiquido / totalReceitas) * 100 : 0;

      // Current month data
      const receitasMes = receitas
        .filter(t => t.mes === currentMonth)
        .reduce((sum, t) => sum + Number(t.valor), 0);
      const despesasMes = despesas
        .filter(t => t.mes === currentMonth)
        .reduce((sum, t) => sum + Number(t.valor), 0);

      // By category
      const receitasPF = receitas
        .filter(t => t.categoria === 'pf')
        .reduce((sum, t) => sum + Number(t.valor), 0);
      const receitasPJ = receitas
        .filter(t => t.categoria === 'pj')
        .reduce((sum, t) => sum + Number(t.valor), 0);

      // By subcategory (partners)
      const receitasPorSubcategoria: Record<string, number> = {};
      receitas.forEach(t => {
        const sub = t.subcategoria || 'outros';
        receitasPorSubcategoria[sub] = (receitasPorSubcategoria[sub] || 0) + Number(t.valor);
      });

      return {
        totalReceitas,
        totalDespesas,
        lucroLiquido,
        margemLucro,
        receitasMes,
        despesasMes,
        receitasPF,
        receitasPJ,
        receitasPorSubcategoria,
        totalTransacoes: transacoes?.length || 0,
      };
    },
  });
}

export function useImportarDadosExternos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-external-db', {
        body: { action: 'import-all' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transacoes-externas'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-mensal-externo'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-anual-externo'] });
      queryClient.invalidateQueries({ queryKey: ['categorias-externas'] });
      queryClient.invalidateQueries({ queryKey: ['subcategorias-externas'] });
      queryClient.invalidateQueries({ queryKey: ['kpis-financeiros-externos'] });
      
      toast({
        title: 'Dados importados',
        description: `${data.totalImported} registros importados do banco externo`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao importar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
