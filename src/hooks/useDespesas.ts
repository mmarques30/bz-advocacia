import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { 
  Despesa, 
  DespesasFilters, 
  KPIsDespesas, 
  DespesaPorCategoria,
  StatusDespesa,
  CategoriaDespesa
} from "@/types/financeiro";
import type { DespesasGlobalFiltersState } from "@/components/financeiro/DespesasGlobalFilters";
import { startOfMonth, endOfMonth, format } from "date-fns";

// Helper para calcular datas baseado nos filtros
// Retorna null para inicio/fim quando não há filtro específico (busca todos os dados)
function getDateRangeFromDespesasFilters(filters?: DespesasGlobalFiltersState): { inicio: Date | null; fim: Date | null } {
  // Se não houver filtros ou dateRange, retornar null para buscar todos os dados
  if (!filters || (!filters.dateRange?.from && !filters.dateRange?.to)) {
    return { inicio: null, fim: null };
  }

  // Se tiver período específico definido via dateRange
  if (filters.dateRange?.from && filters.dateRange?.to) {
    return { 
      inicio: filters.dateRange.from, 
      fim: filters.dateRange.to 
    };
  }
  
  if (filters.dateRange?.from) {
    return { 
      inicio: filters.dateRange.from, 
      fim: null 
    };
  }
  
  if (filters.dateRange?.to) {
    return { 
      inicio: null, 
      fim: filters.dateRange.to 
    };
  }

  return { inicio: null, fim: null };
}

// Mapear categoria_codigo para CategoriaDespesa
function mapCategoriaCodigo(codigo: string | null): CategoriaDespesa {
  const mapeamento: Record<string, CategoriaDespesa> = {
    'aluguel': 'aluguel_condominio',
    'salarios': 'salarios_encargos',
    'honorarios': 'honorarios_terceiros',
    'marketing': 'marketing_publicidade',
    'materiais': 'materiais_expediente',
    'telefonia': 'telefonia_internet',
    'software': 'software_licencas',
    'energia': 'energia_agua',
    'impostos': 'impostos_taxas',
  };
  
  return mapeamento[codigo || ''] || 'outros';
}

// Listar despesas com filtros - busca de transacoes_financeiras
export function useDespesas(filters?: DespesasFilters) {
  return useQuery({
    queryKey: ['despesas', filters],
    queryFn: async () => {
      let query = supabase
        .from('transacoes_financeiras')
        .select('*')
        .eq('tipo_codigo', 'despesa')
        .order('data_transacao', { ascending: false });

      if (filters?.search) {
        query = query.ilike('descricao', `%${filters.search}%`);
      }

      if (filters?.categoria && filters.categoria.length > 0) {
        // Mapear categorias de Despesa para categoria_codigo
        const categoriasCodigo = filters.categoria.map(cat => {
          const reverseMap: Record<CategoriaDespesa, string> = {
            'aluguel_condominio': 'aluguel',
            'salarios_encargos': 'salarios',
            'honorarios_terceiros': 'honorarios',
            'marketing_publicidade': 'marketing',
            'materiais_expediente': 'materiais',
            'telefonia_internet': 'telefonia',
            'software_licencas': 'software',
            'energia_agua': 'energia',
            'impostos_taxas': 'impostos',
            'outros': 'outros',
          };
          return reverseMap[cat] || cat;
        });
        query = query.in('categoria_codigo', categoriasCodigo);
      }

      // Não filtramos por status pois transacoes_financeiras não tem esse campo
      // Todas são consideradas como "pago" (histórico)

      if (filters?.data_inicio) {
        query = query.gte('data_transacao', filters.data_inicio.toISOString().split('T')[0]);
      }

      if (filters?.data_fim) {
        query = query.lte('data_transacao', filters.data_fim.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Mapear para formato Despesa
      const despesas: Despesa[] = (data || []).map(transacao => ({
        id: transacao.id,
        descricao: transacao.descricao || 'Sem descrição',
        valor: Math.abs(Number(transacao.valor)),
        data: transacao.data_transacao,
        categoria: mapCategoriaCodigo(transacao.categoria_codigo),
        processo_id: null,
        forma_pagamento: null,
        status: 'pago' as StatusDespesa, // Todas importadas são pagas
        observacoes: null,
        anexo_url: null,
        created_at: transacao.created_at || '',
        updated_at: transacao.created_at || '',
        created_by: null,
      }));

      return despesas;
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
        .from('transacoes_financeiras')
        .select('*')
        .eq('id', despesaId)
        .eq('tipo_codigo', 'despesa')
        .single();

      if (error) throw error;

      // Mapear para formato Despesa
      const despesa: Despesa = {
        id: data.id,
        descricao: data.descricao || 'Sem descrição',
        valor: Math.abs(Number(data.valor)),
        data: data.data_transacao,
        categoria: mapCategoriaCodigo(data.categoria_codigo),
        processo_id: null,
        forma_pagamento: null,
        status: 'pago' as StatusDespesa,
        observacoes: null,
        anexo_url: null,
        created_at: data.created_at || '',
        updated_at: data.created_at || '',
        created_by: null,
      };

      return despesa;
    },
    enabled: !!despesaId,
  });
}

// Criar despesa - mantém na tabela despesas para novos registros
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

// KPIs de Despesas - busca de transacoes_financeiras
export function useKPIsDespesas(filters?: DespesasGlobalFiltersState) {
  return useQuery({
    queryKey: ['kpis-despesas', filters],
    queryFn: async () => {
      const { inicio, fim } = getDateRangeFromDespesasFilters(filters);

      let query = supabase
        .from('transacoes_financeiras')
        .select('valor, data_transacao, categoria_codigo, subcategoria_codigo')
        .eq('tipo_codigo', 'despesa');

      // Aplicar filtros de data apenas se definidos
      if (inicio) {
        query = query.gte('data_transacao', format(inicio, 'yyyy-MM-dd'));
      }
      if (fim) {
        query = query.lte('data_transacao', format(fim, 'yyyy-MM-dd'));
      }

      // Filtrar por categoria se especificado
      if (filters?.categoria && filters.categoria !== 'todos') {
        query = query.eq('categoria_codigo', filters.categoria);
      }

      const { data, error } = await query;

      if (error) throw error;

      const despesas = data || [];

      // Todas as despesas de transacoes_financeiras são pagas (histórico)
      const total_mes = despesas.reduce((sum, d) => sum + Math.abs(Number(d.valor)), 0);
      const total_pago_mes = total_mes; // Todas são pagas
      const total_pendente = 0;
      const total_atrasado = 0;

      return {
        total_mes,
        total_pendente,
        total_atrasado,
        total_pago_mes,
      } as KPIsDespesas;
    },
  });
}

// Despesas por categoria - busca de transacoes_financeiras
export function useDespesasPorCategoria(filters?: DespesasGlobalFiltersState) {
  return useQuery({
    queryKey: ['despesas-por-categoria', filters],
    queryFn: async () => {
      const { inicio, fim } = getDateRangeFromDespesasFilters(filters);

      let query = supabase
        .from('transacoes_financeiras')
        .select('categoria_codigo, subcategoria_codigo, valor')
        .eq('tipo_codigo', 'despesa');

      // Aplicar filtros de data apenas se definidos
      if (inicio) {
        query = query.gte('data_transacao', format(inicio, 'yyyy-MM-dd'));
      }
      if (fim) {
        query = query.lte('data_transacao', format(fim, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;

      if (error) throw error;

      const despesas = data || [];
      const total = despesas.reduce((sum, d) => sum + Math.abs(Number(d.valor)), 0);

      // Agrupar por subcategoria (mais detalhado) ou categoria
      const porCategoria = despesas.reduce((acc, d) => {
        const cat = d.subcategoria_codigo || d.categoria_codigo || 'outros';
        if (!acc[cat]) {
          acc[cat] = { total: 0, quantidade: 0 };
        }
        acc[cat].total += Math.abs(Number(d.valor));
        acc[cat].quantidade += 1;
        return acc;
      }, {} as Record<string, { total: number; quantidade: number }>);

      // Converter para array com percentual
      return Object.entries(porCategoria).map(([categoria, { total: totalCat, quantidade }]) => ({
        categoria: mapCategoriaCodigo(categoria),
        total: totalCat,
        quantidade,
        percentual: total > 0 ? (totalCat / total) * 100 : 0,
      })) as DespesaPorCategoria[];
    },
  });
}

// Despesas recentes (últimas 5) - busca de transacoes_financeiras
export function useDespesasRecentes(filters?: DespesasGlobalFiltersState) {
  return useQuery({
    queryKey: ['despesas-recentes', filters],
    queryFn: async () => {
      const { inicio, fim } = getDateRangeFromDespesasFilters(filters);

      let query = supabase
        .from('transacoes_financeiras')
        .select('*')
        .eq('tipo_codigo', 'despesa')
        .order('data_transacao', { ascending: false })
        .limit(5);

      // Aplicar filtros de data apenas se definidos
      if (inicio) {
        query = query.gte('data_transacao', format(inicio, 'yyyy-MM-dd'));
      }
      if (fim) {
        query = query.lte('data_transacao', format(fim, 'yyyy-MM-dd'));
      }

      if (filters?.categoria && filters.categoria !== 'todos') {
        query = query.eq('categoria_codigo', filters.categoria);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Mapear para formato Despesa
      const despesas: Despesa[] = (data || []).map(transacao => ({
        id: transacao.id,
        descricao: transacao.descricao || 'Sem descrição',
        valor: Math.abs(Number(transacao.valor)),
        data: transacao.data_transacao,
        categoria: mapCategoriaCodigo(transacao.categoria_codigo),
        processo_id: null,
        forma_pagamento: null,
        status: 'pago' as StatusDespesa,
        observacoes: null,
        anexo_url: null,
        created_at: transacao.created_at || '',
        updated_at: transacao.created_at || '',
        created_by: null,
      }));

      return despesas;
    },
  });
}
