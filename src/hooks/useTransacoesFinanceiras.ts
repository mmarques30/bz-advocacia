import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import type {
  CategoriaFinanceira,
  TipoTransacao,
  SubcategoriaFinanceira,
  TransacaoFinanceira,
  TransacoesFilters,
  ResumoMensal,
} from "@/types/transacoes";

export function useCategorias() {
  return useQuery({
    queryKey: ["categorias-financeiras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_financeiras")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data as CategoriaFinanceira[];
    },
  });
}

export function useTipos() {
  return useQuery({
    queryKey: ["tipos-transacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_transacao")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data as TipoTransacao[];
    },
  });
}

export function useSubcategorias(categoriaId?: string) {
  return useQuery({
    queryKey: ["subcategorias-financeiras", categoriaId],
    queryFn: async () => {
      let query = supabase.from("subcategorias_financeiras").select("*");

      if (categoriaId) {
        query = query.eq("categoria_codigo", categoriaId);
      }

      const { data, error } = await query.order("nome");

      if (error) throw error;
      return data as SubcategoriaFinanceira[];
    },
  });
}

export function useTransacoes(filters: TransacoesFilters = {}) {
  return useQuery({
    queryKey: ["transacoes-financeiras", filters],
    queryFn: async () => {
      let query = supabase
        .from("transacoes_financeiras")
        .select("*")
        .order("data_transacao", { ascending: false });

      // Filtrar por período de datas
      if (filters.dataInicio) {
        query = query.gte("data_transacao", format(filters.dataInicio, "yyyy-MM-dd"));
      }
      if (filters.dataFim) {
        query = query.lte("data_transacao", format(filters.dataFim, "yyyy-MM-dd"));
      }
      // Filtrar por ano se não tiver período específico
      if (filters.ano && !filters.dataInicio && !filters.dataFim) {
        query = query.eq("ano", filters.ano);
      }
      if (filters.tipo_codigo) {
        query = query.eq("tipo_codigo", filters.tipo_codigo);
      }
      if (filters.categoria_codigo) {
        query = query.eq("categoria_codigo", filters.categoria_codigo);
      }
      if (filters.subcategoria_codigo) {
        query = query.eq("subcategoria_codigo", filters.subcategoria_codigo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TransacaoFinanceira[];
    },
  });
}

export function useKPIsTransacoes(filters: TransacoesFilters = {}) {
  return useQuery({
    queryKey: ["kpis-transacoes", filters],
    queryFn: async () => {
      let query = supabase
        .from("transacoes_financeiras")
        .select("tipo_codigo, categoria_codigo, valor");

      // Apply filters
      if (filters.dataInicio) {
        query = query.gte("data_transacao", format(filters.dataInicio, "yyyy-MM-dd"));
      }
      if (filters.dataFim) {
        query = query.lte("data_transacao", format(filters.dataFim, "yyyy-MM-dd"));
      }
      if (filters.ano && !filters.dataInicio && !filters.dataFim) {
        query = query.eq("ano", filters.ano);
      }
      if (filters.tipo_codigo) {
        query = query.eq("tipo_codigo", filters.tipo_codigo);
      }
      if (filters.categoria_codigo) {
        query = query.eq("categoria_codigo", filters.categoria_codigo);
      }
      if (filters.subcategoria_codigo) {
        query = query.eq("subcategoria_codigo", filters.subcategoria_codigo);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transacoes = data as TransacaoFinanceira[];

      const receitas = transacoes
        .filter((t) => t.tipo_codigo === "receita")
        .reduce((sum, t) => sum + Number(t.valor), 0);

      const despesas = transacoes
        .filter((t) => t.tipo_codigo === "despesa")
        .reduce((sum, t) => sum + Number(t.valor), 0);

      const receitasPF = transacoes
        .filter((t) => t.tipo_codigo === "receita" && t.categoria_codigo === "pf")
        .reduce((sum, t) => sum + Number(t.valor), 0);

      const receitasPJ = transacoes
        .filter((t) => t.tipo_codigo === "receita" && t.categoria_codigo === "pj")
        .reduce((sum, t) => sum + Number(t.valor), 0);

      return {
        receitas,
        despesas,
        resultado: receitas - despesas,
        receitasPF,
        receitasPJ,
        totalTransacoes: transacoes.length,
      };
    },
  });
}

export function useResumoMensal(filters: TransacoesFilters = {}) {
  const ano = filters.ano || new Date().getFullYear();
  
  return useQuery({
    queryKey: ["resumo-mensal-transacoes", filters],
    queryFn: async () => {
      let query = supabase
        .from("transacoes_financeiras")
        .select("mes, mes_nome, tipo_codigo, valor")
        .eq("ano", ano);

      // Apply additional filters
      if (filters.tipo_codigo) {
        query = query.eq("tipo_codigo", filters.tipo_codigo);
      }
      if (filters.categoria_codigo) {
        query = query.eq("categoria_codigo", filters.categoria_codigo);
      }
      if (filters.subcategoria_codigo) {
        query = query.eq("subcategoria_codigo", filters.subcategoria_codigo);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transacoes = data as TransacaoFinanceira[];

      const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];

      const resumo: ResumoMensal[] = meses.map((mes_nome, index) => {
        const mes = index + 1;
        const transacoesMes = transacoes.filter((t) => t.mes === mes);

        const receitas = transacoesMes
          .filter((t) => t.tipo_codigo === "receita")
          .reduce((sum, t) => sum + Number(t.valor), 0);

        const despesas = transacoesMes
          .filter((t) => t.tipo_codigo === "despesa")
          .reduce((sum, t) => sum + Number(t.valor), 0);

        return {
          mes,
          mes_nome,
          receitas,
          despesas,
          resultado: receitas - despesas,
        };
      });

      return resumo;
    },
  });
}

export function useResumoSubcategoria(ano?: number) {
  return useQuery({
    queryKey: ["resumo-subcategoria-transacoes", ano],
    queryFn: async () => {
      let query = supabase
        .from("transacoes_financeiras")
        .select("subcategoria_codigo, tipo_codigo, valor")
        .eq("tipo_codigo", "receita");

      if (ano) {
        query = query.eq("ano", ano);
      }

      const { data: transacoes, error } = await query;

      if (error) throw error;

      const { data: subcategorias } = await supabase
        .from("subcategorias_financeiras")
        .select("codigo, nome");

      const subcatMap = new Map(
        (subcategorias || []).map((s) => [s.codigo, s.nome])
      );

      const totais = new Map<string, number>();

      for (const t of transacoes as TransacaoFinanceira[]) {
        const atual = totais.get(t.subcategoria_codigo) || 0;
        totais.set(t.subcategoria_codigo, atual + Number(t.valor));
      }

      const total = Array.from(totais.values()).reduce((a, b) => a + b, 0);

      return Array.from(totais.entries()).map(([codigo, valor]) => ({
        subcategoria_codigo: codigo,
        subcategoria_nome: subcatMap.get(codigo) || codigo,
        total: valor,
        percentual: total > 0 ? (valor / total) * 100 : 0,
      }));
    },
  });
}

// Hook para receitas por responsável (baseado em subcategoria_codigo)
// subcategoria_codigo = "eliziane" → Eliziane
// subcategoria_codigo = "juliana" → Juliana
// categoria_codigo = "pj" → B&Z Advocacia
export function useReceitasPorResponsavel(filters?: TransacoesFilters) {
  return useQuery({
    queryKey: ["receitas-por-responsavel", filters],
    queryFn: async () => {
      let query = supabase
        .from("transacoes_financeiras")
        .select("categoria_codigo, subcategoria_codigo, descricao, valor")
        .eq("tipo_codigo", "receita");

      // Apply filters
      if (filters?.dataInicio) {
        query = query.gte("data_transacao", format(filters.dataInicio, "yyyy-MM-dd"));
      }
      if (filters?.dataFim) {
        query = query.lte("data_transacao", format(filters.dataFim, "yyyy-MM-dd"));
      }
      if (filters?.ano && !filters?.dataInicio && !filters?.dataFim) {
        query = query.eq("ano", filters.ano);
      }

      const { data: transacoes, error } = await query;

      if (error) throw error;

      const totais = new Map<string, number>();
      
      for (const t of transacoes || []) {
        let responsavel = "B&Z Advocacia";
        
        // Verificar subcategoria primeiro (dados importados com sócia identificada)
        const subcatLower = (t.subcategoria_codigo || "").toLowerCase();
        
        if (subcatLower === "eliziane") {
          responsavel = "Eliziane";
        } else if (subcatLower === "juliana") {
          responsavel = "Juliana";
        } else if (t.categoria_codigo === "pj") {
          // Se for PJ, é B&Z
          responsavel = "B&Z Advocacia";
        } else if (t.categoria_codigo === "pf") {
          // PF sem subcategoria identificada - tentar pela descrição como fallback
          const descLower = (t.descricao || "").toLowerCase();
          
          if (descLower.includes("eliziane")) {
            responsavel = "Eliziane";
          } else if (descLower.includes("juliana")) {
            responsavel = "Juliana";
          } else {
            responsavel = "PF (não identificado)";
          }
        }
        
        const atual = totais.get(responsavel) || 0;
        totais.set(responsavel, atual + Number(t.valor));
      }

      const total = Array.from(totais.values()).reduce((a, b) => a + b, 0);

      return Array.from(totais.entries())
        .map(([responsavel, valor]) => ({
          responsavel,
          total: valor,
          percentual: total > 0 ? (valor / total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);
    },
  });
}

// Novo hook para resumo por ano (quando não há filtro de ano específico)
export function useResumoAnual() {
  return useQuery({
    queryKey: ["resumo-anual-transacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select("ano, tipo_codigo, valor");

      if (error) throw error;

      const transacoes = data as TransacaoFinanceira[];

      // Agrupar por ano
      const anosMap = new Map<number, { receitas: number; despesas: number }>();

      for (const t of transacoes) {
        const atual = anosMap.get(t.ano) || { receitas: 0, despesas: 0 };
        if (t.tipo_codigo === "receita") {
          atual.receitas += Number(t.valor);
        } else if (t.tipo_codigo === "despesa") {
          atual.despesas += Number(t.valor);
        }
        anosMap.set(t.ano, atual);
      }

      // Converter para array e ordenar por ano
      return Array.from(anosMap.entries())
        .map(([ano, valores]) => ({
          ano,
          receitas: valores.receitas,
          despesas: valores.despesas,
          resultado: valores.receitas - valores.despesas,
        }))
        .sort((a, b) => a.ano - b.ano);
    },
  });
}

// === MUTATIONS ===

export function useClearTransacoes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("transacoes_financeiras")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes-financeiras"] });
      queryClient.invalidateQueries({ queryKey: ["kpis-transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["resumo-mensal-transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["resumo-subcategoria-transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["resumo-anual-transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["receitas-por-responsavel"] });
      toast.success("Todos os dados financeiros foram removidos!");
    },
    onError: (error) => {
      console.error("Erro ao limpar dados:", error);
      toast.error("Erro ao limpar dados financeiros");
    },
  });
}

export function useCreateTransacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      transacao: Omit<TransacaoFinanceira, "id" | "created_at">
    ) => {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .insert(transacao)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes-financeiras"] });
      queryClient.invalidateQueries({ queryKey: ["kpis-transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["resumo-mensal-transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["resumo-subcategoria-transacoes"] });
    },
  });
}

export function useUpdateTransacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...transacao
    }: Partial<TransacaoFinanceira> & { id: string }) => {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .update(transacao)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes-financeiras"] });
      queryClient.invalidateQueries({ queryKey: ["kpis-transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["resumo-mensal-transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["resumo-subcategoria-transacoes"] });
    },
  });
}

export function useDeleteTransacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transacoes_financeiras")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes-financeiras"] });
      queryClient.invalidateQueries({ queryKey: ["kpis-transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["resumo-mensal-transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["resumo-subcategoria-transacoes"] });
    },
  });
}

export function useBulkCreateTransacoes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      transacoes: Omit<TransacaoFinanceira, "id" | "created_at">[]
    ) => {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .insert(transacoes)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes-financeiras"] });
      queryClient.invalidateQueries({ queryKey: ["kpis-transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["resumo-mensal-transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["resumo-subcategoria-transacoes"] });
    },
  });
}
