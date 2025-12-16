import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

      if (filters.mes) {
        query = query.eq("mes", filters.mes);
      }
      if (filters.ano) {
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
      if (filters.busca) {
        query = query.ilike("descricao", `%${filters.busca}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TransacaoFinanceira[];
    },
  });
}

export function useKPIsTransacoes(ano: number = 2025) {
  return useQuery({
    queryKey: ["kpis-transacoes", ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select("tipo_codigo, categoria_codigo, valor")
        .eq("ano", ano);

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

export function useResumoMensal(ano: number = 2025) {
  return useQuery({
    queryKey: ["resumo-mensal-transacoes", ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select("mes, mes_nome, tipo_codigo, valor")
        .eq("ano", ano);

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

export function useResumoSubcategoria(ano: number = 2025) {
  return useQuery({
    queryKey: ["resumo-subcategoria-transacoes", ano],
    queryFn: async () => {
      const { data: transacoes, error } = await supabase
        .from("transacoes_financeiras")
        .select("subcategoria_codigo, tipo_codigo, valor")
        .eq("ano", ano)
        .eq("tipo_codigo", "receita");

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
