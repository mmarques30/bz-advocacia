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

/**
 * KPIs financeiros do periodo.
 *
 * Rodada 5: tenta a RPC server-side `get_financeiro_kpis` que faz tudo
 * num unico round-trip. Se a RPC nao estiver disponivel (ambiente sem
 * a migration), cai no caminho legado de baixar parcelas + transacoes
 * inteiras e agregar em JS — preserva 100% o comportamento antigo.
 */
export function useKPIsFinanceiros(filters?: FaturamentoFiltersState) {
  return useQuery({
    queryKey: ["kpis-financeiros", filters],
    queryFn: async (): Promise<KPIsFinanceiros> => {
      const { inicio: primeiroDiaMes, fim: ultimoDiaMes } = getDateRangeFromFilters(filters);
      const fmtDate = (d: Date | null) => (d ? format(d, "yyyy-MM-dd") : null);

      // 1) Caminho preferido: RPC server-side (1 query, agrega tudo).
      try {
        const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
          "get_financeiro_kpis",
          {
            _data_inicio: fmtDate(primeiroDiaMes),
            _data_fim: fmtDate(ultimoDiaMes),
            _status:
              filters?.status && filters.status !== "todos" ? filters.status : null,
            _tipo_servico:
              filters?.tipoServico && filters.tipoServico !== "todos"
                ? filters.tipoServico
                : null,
            _conta:
              filters?.conta && filters.conta !== "todos" ? filters.conta : null,
          },
        );
        if (rpcError) throw rpcError;
        const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        if (row) {
          return {
            receita_mes: Number(row.receita_mes) || 0,
            recebido_mes: Number(row.recebido_mes) || 0,
            a_receber_mes: Number(row.a_receber_mes) || 0,
            valor_atrasado: Number(row.valor_atrasado) || 0,
            taxa_inadimplencia: Number(row.taxa_inadimplencia) || 0,
            ticket_medio: Number(row.ticket_medio) || 0,
            projecao: Number(row.projecao) || 0,
          };
        }
      } catch (rpcErr) {
        console.warn(
          "RPC get_financeiro_kpis indisponivel, usando agregacao client-side:",
          rpcErr,
        );
      }

      // 2) Fallback legado (pre-Rodada 5): baixa tudo e agrega em JS.
      //    Mantido para ambientes onde a migration nao foi aplicada.
      const hoje = new Date();
      const { data: parcelas, error } = await supabase
        .from("parcelas_financeiras")
        .select("*")
        .limit(10000);

      if (error) throw error;

      const receitaParcelas = parcelas
        ?.filter(p => {
          if (p.status !== 'pago' || !p.data_pagamento) return false;
          const dataPagamento = new Date(p.data_pagamento);
          if (primeiroDiaMes && dataPagamento < primeiroDiaMes) return false;
          if (ultimoDiaMes && dataPagamento > ultimoDiaMes) return false;
          return true;
        })
        .reduce((sum, p) => sum + (p.valor_pago || 0), 0) || 0;

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

/**
 * Comparativo Projetado vs Realizado dos ultimos N meses.
 *
 * Rodada 5: tenta a RPC server-side `get_projetado_vs_realizado` que
 * faz tudo num GROUP BY mes/ano + LEFT JOIN com metas_mensais. O hook
 * antigo fazia 1 query baixando todas as transacoes + 1 baixando todas
 * as parcelas + N iteracoes de filter/reduce em JS. Agora 1 query so.
 */
export function useProjetadoVsRealizado(meses: number = 12) {
  return useQuery({
    queryKey: ["projetado-vs-realizado", meses],
    queryFn: async (): Promise<ProjetadoVsRealizado[]> => {
      // 1) Caminho preferido: RPC server-side.
      try {
        const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
          "get_projetado_vs_realizado",
          { _meses: meses },
        );
        if (rpcError) throw rpcError;
        if (Array.isArray(rpcData)) {
          return rpcData.map((row: any) => ({
            mes: row.mes_label,
            realizado: Number(row.realizado) || 0,
            projetado: Number(row.projetado) || 0,
          }));
        }
      } catch (rpcErr) {
        console.warn(
          "RPC get_projetado_vs_realizado indisponivel, usando agregacao client-side:",
          rpcErr,
        );
      }

      // 2) Fallback legado (pre-Rodada 5).
      //
      // Antes de PR G/H, este fallback baixava ate 10k transacoes + 10k
      // parcelas (independente do periodo) e filtrava em JS dentro do
      // loop de N meses. Com a base crescendo, o .limit(10000) poderia
      // esconder registros recentes. Empurramos a janela de N meses pra
      // o Postgres (.gte na data minima) mantendo o limit como guardrail.
      const hoje = new Date();
      const dataMinima = startOfMonth(subMonths(hoje, meses - 1));
      const dataMinimaIso = format(dataMinima, "yyyy-MM-dd");

      const { data: transacoes } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .or("tipo_codigo.eq.receita,tipo_codigo.eq.REC")
        .gte("data_transacao", dataMinimaIso)
        .limit(10000);

      const { data: parcelas } = await supabase
        .from("parcelas_financeiras")
        .select("*")
        .eq("status", "pago")
        .gte("data_pagamento", dataMinimaIso)
        .limit(10000);

      const { data: metas } = await supabase
        .from("metas_mensais")
        .select("*");

      const resultado: ProjetadoVsRealizado[] = [];

      for (let i = meses - 1; i >= 0; i--) {
        const data = subMonths(hoje, i);
        const inicio = startOfMonth(data);
        const fim = endOfMonth(data);
        const mesNum = data.getMonth() + 1;
        const anoNum = data.getFullYear();

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
        const meta = (metas || []).find((m: any) => m.mes === mesNum && m.ano === anoNum);
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
