import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import type {
  Despesa,
  DespesasFilters,
  KPIsDespesas,
  DespesaPorCategoria,
  StatusDespesa,
  CategoriaDespesa,
} from "@/types/financeiro";
import type { DespesasGlobalFiltersState } from "@/components/financeiro/DespesasGlobalFilters";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { mapCategoriaCodigo, resolveCategoriaLabel } from "@/lib/categoriaDespesa";

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

// mapCategoriaCodigo e resolveCategoriaLabel foram extraidos para
// src/lib/categoriaDespesa.ts (pure functions, testaveis). Sao reusados
// aqui e no grafico.

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

      const { data, error } = await query.limit(10000);

      if (error) throw error;

      // Despesas importadas / legadas vivem em transacoes_financeiras.
      const despesasLegadas: Despesa[] = (data || []).map(transacao => ({
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
        conta: transacao.conta || null,
      }));

      // Despesas criadas via form novo vivem em `despesas` (possuem
      // campos ricos como status, forma_pagamento, processo_id, etc.).
      // Uniao dos dois para cobrir ambos os ciclos de vida.
      let despesasQuery = supabase
        .from('despesas')
        .select('*')
        .order('data', { ascending: false });

      if (filters?.search) {
        despesasQuery = despesasQuery.ilike('descricao', `%${filters.search}%`);
      }
      if (filters?.categoria && filters.categoria.length > 0) {
        despesasQuery = despesasQuery.in('categoria', filters.categoria);
      }
      if (filters?.status && filters.status.length > 0) {
        despesasQuery = despesasQuery.in('status', filters.status);
      }
      if (filters?.data_inicio) {
        despesasQuery = despesasQuery.gte('data', filters.data_inicio.toISOString().split('T')[0]);
      }
      if (filters?.data_fim) {
        despesasQuery = despesasQuery.lte('data', filters.data_fim.toISOString().split('T')[0]);
      }

      const { data: despesasNovas } = await despesasQuery.limit(10000);
      const despesasRicas: Despesa[] = (despesasNovas || []) as Despesa[];

      // Merge + ordena por data DESC (mais recentes primeiro).
      const todas = [...despesasRicas, ...despesasLegadas];
      todas.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
      return todas;
    },
  });
}

// Buscar detalhes de uma despesa
export function useDespesa(despesaId: string | null) {
  return useQuery({
    queryKey: ['despesa', despesaId],
    queryFn: async () => {
      if (!despesaId) return null;

      // 1) Tenta a tabela `despesas` primeiro (shape rico, com
      //    status/forma_pagamento/processo_id). Despesas criadas
      //    pelo form novo e as parcelas vivem aqui.
      const rich = await supabase
        .from('despesas')
        .select('*')
        .eq('id', despesaId)
        .maybeSingle();

      if (rich.data) {
        return rich.data as Despesa;
      }

      // 2) Fallback: legacy em transacoes_financeiras (importadas).
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
        conta: data.conta || null,
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

/**
 * Resolve em qual tabela uma despesa vive (transacoes_financeiras ou despesas).
 * As despesas exibidas no CRUD sao lidas de transacoes_financeiras (tipo_codigo=despesa),
 * mas despesas novas criadas pelo form NewDespesaDialog vao para a tabela `despesas`.
 * Update/delete precisam rotear para a tabela certa baseado em qual contem o id.
 */
async function resolveDespesaTable(
  despesaId: string,
): Promise<"transacoes_financeiras" | "despesas"> {
  const { data: transacao } = await supabase
    .from("transacoes_financeiras")
    .select("id")
    .eq("id", despesaId)
    .maybeSingle();
  if (transacao) return "transacoes_financeiras";
  return "despesas";
}

/**
 * Converte um payload shape Despesa para o shape aceito por
 * transacoes_financeiras. Campos que nao existem em transacoes
 * sao descartados; os unicos realmente usados sao descricao, valor,
 * data, categoria (como subcategoria_codigo/categoria_codigo) e conta.
 */
function despesaToTransacaoPayload(
  despesa: Partial<Despesa>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (despesa.descricao !== undefined) payload.descricao = despesa.descricao;
  if (despesa.valor !== undefined) payload.valor = despesa.valor;
  if (despesa.data !== undefined) payload.data_transacao = despesa.data;
  if (despesa.conta !== undefined) payload.conta = despesa.conta;
  if (despesa.categoria !== undefined) {
    // Mantemos o codigo curto na subcategoria (backward compat com dados
    // importados — "aluguel", "marketing", "juliana", etc.)
    const curto = despesa.categoria.split("_")[0];
    payload.subcategoria_codigo = curto;
  }
  return payload;
}
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...despesa }: Partial<Despesa> & { id: string }) => {
      const tabela = await resolveDespesaTable(id);

      if (tabela === "transacoes_financeiras") {
        // Registro importado / legado: atualiza em transacoes_financeiras.
        const payload = despesaToTransacaoPayload(despesa);
        const { data, error } = await supabase
          .from("transacoes_financeiras")
          .update(payload)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

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
      queryClient.invalidateQueries({ queryKey: ['despesas-atrasadas'] });
      queryClient.invalidateQueries({ queryKey: ['proximos-vencimentos'] });
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
      const tabela = await resolveDespesaTable(despesaId);
      const { error } = await supabase
        .from(tabela)
        .delete()
        .eq("id", despesaId);

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

      const { data, error } = await query.limit(10000);

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

      const { data, error } = await query.limit(10000);

      if (error) throw error;

      const despesas = data || [];
      const total = despesas.reduce((sum, d) => sum + Math.abs(Number(d.valor)), 0);

      // Agrupar pelo LABEL resolvido (nao pelo codigo bruto). Isso evita que
      // varias subcategorias desconhecidas virem multiplas entradas todas
      // colapsadas em "Outros" no grafico — o bug original fazia 4 fatias
      // com o mesmo rotulo mas valores diferentes.
      const porCategoria = despesas.reduce((acc, d) => {
        const label = resolveCategoriaLabel(d.subcategoria_codigo || d.categoria_codigo);
        if (!acc[label]) {
          acc[label] = { total: 0, quantidade: 0 };
        }
        acc[label].total += Math.abs(Number(d.valor));
        acc[label].quantidade += 1;
        return acc;
      }, {} as Record<string, { total: number; quantidade: number }>);

      // Converter para array com percentual. Fatias < 1% tendem a poluir o
      // grafico com labels sobrepostas; agregamos as muito pequenas em "Outros".
      const entries = Object.entries(porCategoria).map(
        ([categoria, { total: totalCat, quantidade }]) => ({
          categoria,
          total: totalCat,
          quantidade,
          percentual: total > 0 ? (totalCat / total) * 100 : 0,
        }),
      );

      const significativos = entries.filter((e) => e.percentual >= 1);
      const pequenos = entries.filter((e) => e.percentual < 1);

      if (pequenos.length > 0 && significativos.length > 0) {
        const soma = pequenos.reduce((s, e) => s + e.total, 0);
        const qtd = pequenos.reduce((s, e) => s + e.quantidade, 0);
        significativos.push({
          categoria: 'Outros',
          total: soma,
          quantidade: qtd,
          percentual: total > 0 ? (soma / total) * 100 : 0,
        });
      } else if (pequenos.length > 0) {
        // Se nao houver nada "significativo", mantem os dados originais
        // para nao esconder a tabela inteira num "Outros" global.
        return entries as DespesaPorCategoria[];
      }

      return significativos.sort((a, b) => b.total - a.total) as DespesaPorCategoria[];
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
        conta: transacao.conta || null,
      }));

      return despesas;
    },
  });
}
