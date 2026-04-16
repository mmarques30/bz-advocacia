/**
 * Hooks de receitas: serie mensal, fluxo de caixa, receitas recentes.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/lib/toast";
import { format, subMonths, differenceInDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import type { FaturamentoFiltersState } from "@/components/financeiro/FaturamentoFilters";
import { getDateRangeFromFilters } from "./_shared";
import { warnIfTruncated } from "@/lib/queryGuards";

import type { ReceitaMensal, FluxoCaixa } from "@/types/financeiro";

export function useReceitaMensal(meses: number = 12) {
  return useQuery({
    queryKey: ["receita-mensal", meses],
    queryFn: async (): Promise<ReceitaMensal[]> => {
      const resultado: ReceitaMensal[] = [];
      const hoje = new Date();

      for (let i = meses - 1; i >= 0; i--) {
        const data = subMonths(hoje, i);
        const primeiroDia = new Date(data.getFullYear(), data.getMonth(), 1);
        const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0);

        // Buscar receitas (parcelas pagas)
        const { data: parcelas } = await supabase
          .from("parcelas_financeiras")
          .select("*")
          .eq("status", "pago")
          .gte("data_pagamento", format(primeiroDia, "yyyy-MM-dd"))
          .lte("data_pagamento", format(ultimoDia, "yyyy-MM-dd"));

        // Buscar despesas do mês
        const { data: despesas } = await supabase
          .from("despesas")
          .select("valor")
          .gte("data", format(primeiroDia, "yyyy-MM-dd"))
          .lte("data", format(ultimoDia, "yyyy-MM-dd"));

        resultado.push({
          mes: format(data, "MMM/yy"),
          receita: parcelas?.reduce((sum, p) => sum + (p.valor_pago || 0), 0) || 0,
          despesas: despesas?.reduce((sum, d) => sum + Number(d.valor), 0) || 0,
          quantidade: parcelas?.length || 0,
        });
      }

      return resultado;
    },
  });
}

export function useFluxoCaixa(filters?: FaturamentoFiltersState) {
  return useQuery({
    queryKey: ["fluxo-caixa", filters],
    queryFn: async (): Promise<FluxoCaixa[]> => {
      const { inicio, fim } = getDateRangeFromFilters(filters);
      
      // Determinar granularidade baseado no período (se não houver filtro, usar mês)
      const diasPeriodo = inicio && fim ? differenceInDays(fim, inicio) : 365;
      const granularidade: 'dia' | 'mes' = diasPeriodo > 62 ? 'mes' : 'dia';
      
      let parcelasQuery = supabase
        .from("parcelas_financeiras")
        .select("*")
        .eq("status", "pago")
        .order("data_pagamento", { ascending: true });

      // Aplicar filtros de data apenas se definidos
      if (inicio) {
        parcelasQuery = parcelasQuery.gte("data_pagamento", format(inicio, "yyyy-MM-dd"));
      }
      if (fim) {
        parcelasQuery = parcelasQuery.lte("data_pagamento", format(fim, "yyyy-MM-dd"));
      }

      const { data: parcelas } = await parcelasQuery.limit(10000);
      warnIfTruncated(parcelas, "useFluxoCaixa/parcelas");

      // Buscar transações importadas (receitas) — push filtro de tipo
      // server-side para nao baixar despesas e depois descartar em JS.
      let transacoesQuery = supabase
        .from("transacoes_financeiras")
        .select("*")
        .or("tipo_codigo.eq.receita,tipo_codigo.eq.REC");

      if (inicio) {
        transacoesQuery = transacoesQuery.gte("data_transacao", format(inicio, "yyyy-MM-dd"));
      }
      if (fim) {
        transacoesQuery = transacoesQuery.lte("data_transacao", format(fim, "yyyy-MM-dd"));
      }

      const { data: transacoes } = await transacoesQuery.limit(10000);
      warnIfTruncated(transacoes, "useFluxoCaixa/transacoes");

      const fluxo: Record<string, number> = {};

      // Função para gerar chave baseada na granularidade
      const getChave = (dataStr: string) => {
        const date = new Date(dataStr);
        if (granularidade === 'mes') {
          return format(date, "yyyy-MM");
        }
        return format(date, "yyyy-MM-dd");
      };

      // Adicionar parcelas pagas
      parcelas?.forEach(p => {
        if (p.data_pagamento) {
          const chave = getChave(p.data_pagamento);
          fluxo[chave] = (fluxo[chave] || 0) + (p.valor_pago || 0);
        }
      });

      // Adicionar transações importadas (receitas). O filtro de tipo
      // foi empurrado para o Postgres (via .or()), aqui ja temos so
      // receitas — nao precisa refiltrar.
      transacoes?.forEach(t => {
        if (t.data_transacao) {
          const chave = getChave(t.data_transacao);
          fluxo[chave] = (fluxo[chave] || 0) + (t.valor || 0);
        }
      });

      return Object.entries(fluxo)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([data, entradas]) => ({
          data,
          entradas,
          granularidade,
        }));
    },
  });
}


export function useReceitasRecentes(limite: number = 5) {
  return useQuery({
    queryKey: ["receitas-recentes", limite],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .or("tipo_codigo.eq.receita,tipo_codigo.eq.REC")
        .order("data_transacao", { ascending: false })
        .limit(limite);

      if (error) throw error;

      return data?.map(t => ({
        id: t.id,
        data: t.data_transacao,
        descricao: t.descricao || t.subcategoria_codigo || "Receita",
        subcategoria: t.subcategoria_codigo,
        valor: t.valor || 0,
      })) || [];
    },
  });
}

// Hook para top subcategorias por receita
