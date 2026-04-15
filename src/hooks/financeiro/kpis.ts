/**
 * Hooks de KPIs financeiros (totalizadores gerais do periodo).
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/lib/toast";
import { format, subMonths, differenceInDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import type { FaturamentoFiltersState } from "@/components/financeiro/FaturamentoFilters";
import { getDateRangeFromFilters } from "./_shared";

import type { KPIsFinanceiros, ProjetadoVsRealizado } from "@/types/financeiro";

export function useKPIsFinanceiros(filters?: FaturamentoFiltersState) {
  return useQuery({
    queryKey: ["kpis-financeiros", filters],
    queryFn: async (): Promise<KPIsFinanceiros> => {
      const hoje = new Date();
      const { inicio: primeiroDiaMes, fim: ultimoDiaMes } = getDateRangeFromFilters(filters);

      const { data: parcelas, error } = await supabase
        .from("parcelas_financeiras")
        .select("*")
        .limit(10000);

      if (error) throw error;

      // Filtrar parcelas por período se definido
      const receitaParcelas = parcelas
        ?.filter(p => {
          if (p.status !== 'pago' || !p.data_pagamento) return false;
          const dataPagamento = new Date(p.data_pagamento);
          if (primeiroDiaMes && dataPagamento < primeiroDiaMes) return false;
          if (ultimoDiaMes && dataPagamento > ultimoDiaMes) return false;
          return true;
        })
        .reduce((sum, p) => sum + (p.valor_pago || 0), 0) || 0;

      // Buscar transações importadas (tipo receita)
      const { data: transacoes } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .limit(10000);

      const receitaImportada = transacoes
        ?.filter(t => {
          if (!t.data_transacao) return false;
          const dataTransacao = new Date(t.data_transacao);
          const tipoReceita = t.tipo_codigo === 'receita' || t.tipo_codigo === 'REC';
          if (!tipoReceita) return false;
          if (primeiroDiaMes && dataTransacao < primeiroDiaMes) return false;
          if (ultimoDiaMes && dataTransacao > ultimoDiaMes) return false;
          return true;
        })
        .reduce((sum, t) => sum + (t.valor || 0), 0) || 0;

      const receitaMes = receitaParcelas + receitaImportada;

      const aReceberMes = parcelas
        ?.filter(p => {
          if (p.status !== 'pendente') return false;
          const dataVencimento = new Date(p.data_vencimento);
          if (primeiroDiaMes && dataVencimento < primeiroDiaMes) return false;
          if (ultimoDiaMes && dataVencimento > ultimoDiaMes) return false;
          return true;
        })
        .reduce((sum, p) => sum + p.valor, 0) || 0;

      const valorAtrasado = parcelas
        ?.filter(p => p.status !== 'pago' && new Date(p.data_vencimento) < hoje)
        .reduce((sum, p) => sum + p.valor, 0) || 0;

      const totalParcelas = parcelas?.length || 0;
      const parcelasAtrasadas = parcelas?.filter(p => 
        p.status !== 'pago' && new Date(p.data_vencimento) < hoje
      ).length || 0;

      const taxaInadimplencia = totalParcelas > 0 
        ? (parcelasAtrasadas / totalParcelas) * 100 
        : 0;

      let acordosQuery = supabase.from("acordos_financeiros").select("*");
      
      // Aplicar filtros de status e tipo se existirem
      if (filters?.status && filters.status !== "todos") {
        acordosQuery = acordosQuery.eq("status", filters.status);
      }
      if (filters?.tipoServico && filters.tipoServico !== "todos") {
        acordosQuery = acordosQuery.eq("tipo_servico", filters.tipoServico);
      }
      if (filters?.conta && filters.conta !== "todos") {
        acordosQuery = acordosQuery.eq("conta", filters.conta);
      }

      const { data: acordos } = await acordosQuery;

      const ticketMedio = acordos && acordos.length > 0
        ? acordos.reduce((sum, a) => sum + a.valor_total, 0) / acordos.length
        : 0;

      // Projeção: soma das parcelas pendentes de acordos ativos
      const projecao = parcelas
        ?.filter(p => p.status === 'pendente')
        .reduce((sum, p) => sum + p.valor, 0) || 0;

      return {
        receita_mes: receitaMes,
        recebido_mes: receitaMes,
        a_receber_mes: aReceberMes,
        valor_atrasado: valorAtrasado,
        taxa_inadimplencia: taxaInadimplencia,
        ticket_medio: ticketMedio,
        projecao,
      };
    },
  });
}

export function useProjetadoVsRealizado(meses: number = 12) {
  return useQuery({
    queryKey: ["projetado-vs-realizado", meses],
    queryFn: async (): Promise<ProjetadoVsRealizado[]> => {
      // Buscar receitas reais de transacoes_financeiras
      const { data: transacoes } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .limit(10000);

      // Buscar parcelas pagas
      const { data: parcelas } = await supabase
        .from("parcelas_financeiras")
        .select("*")
        .eq("status", "pago")
        .limit(10000);

      // Buscar metas mensais
      const { data: metas } = await supabase
        .from("metas_mensais")
        .select("*");

      const hoje = new Date();
      const resultado: ProjetadoVsRealizado[] = [];

      for (let i = meses - 1; i >= 0; i--) {
        const data = subMonths(hoje, i);
        const inicio = startOfMonth(data);
        const fim = endOfMonth(data);
        const mesNum = data.getMonth() + 1;
        const anoNum = data.getFullYear();

        // Realizado: transações de receita + parcelas pagas
        const receitaTransacoes = (transacoes || [])
          .filter(t => {
            if (!t.data_transacao) return false;
            const tipoReceita = t.tipo_codigo === 'receita' || t.tipo_codigo === 'REC';
            if (!tipoReceita) return false;
            const dt = new Date(t.data_transacao);
            return dt >= inicio && dt <= fim;
          })
          .reduce((sum, t) => sum + (t.valor || 0), 0);

        const receitaParcelas = (parcelas || [])
          .filter(p => {
            if (!p.data_pagamento) return false;
            const dp = new Date(p.data_pagamento);
            return dp >= inicio && dp <= fim;
          })
          .reduce((sum, p) => sum + (p.valor_pago || 0), 0);

        const realizado = receitaTransacoes + receitaParcelas;

        // Projetado: buscar da tabela metas_mensais
        const meta = (metas || []).find(m => m.mes === mesNum && m.ano === anoNum);
        const projetado = meta ? Number(meta.valor) : 0;

        resultado.push({
          mes: format(data, "MMM/yy"),
          realizado,
          projetado,
        });
      }

      return resultado;
    },
  });
}


export function useReceitasMesAtual() {
  return useQuery({
    queryKey: ["receitas-mes-atual"],
    queryFn: async () => {
      const inicio = startOfMonth(new Date());
      const fim = endOfMonth(new Date());

      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select("subcategoria_codigo, valor, data_transacao")
        .or("tipo_codigo.eq.receita,tipo_codigo.eq.REC")
        .gte("data_transacao", format(inicio, "yyyy-MM-dd"))
        .lte("data_transacao", format(fim, "yyyy-MM-dd"));

      if (error) throw error;

      // Agrupar por subcategoria (que representa o responsável)
      const agrupado: Record<string, { total: number; quantidade: number }> = {};
      let totalGeral = 0;
      
      (data || []).forEach(t => {
        const key = t.subcategoria_codigo || "Outros";
        if (!agrupado[key]) {
          agrupado[key] = { total: 0, quantidade: 0 };
        }
        agrupado[key].total += t.valor || 0;
        agrupado[key].quantidade += 1;
        totalGeral += t.valor || 0;
      });

      return {
        totalGeral,
        quantidadeTotal: data?.length || 0,
        porResponsavel: Object.entries(agrupado)
          .map(([responsavel, dados]) => ({
            responsavel,
            total: dados.total,
            quantidade: dados.quantidade,
          }))
      .sort((a, b) => b.total - a.total),
      };
    },
  });
}
