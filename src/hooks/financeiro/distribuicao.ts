/**
 * Hooks de distribuicao por tipo de servico e subcategoria.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/lib/toast";
import { format, subMonths, addMonths, differenceInDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import type { FaturamentoFiltersState } from "@/components/financeiro/FaturamentoFilters";
import { applyDateRangeFromFilters, getDateRangeFromFilters } from "./_shared";
import { warnIfTruncated } from "@/lib/queryGuards";

import type { DistribuicaoTipo, DistribuicaoTipoAgregado } from "@/types/financeiro";

export interface FaturamentoMensalPonto {
  mes: string; // yyyy-MM
  novos: number; // valor de contratos criados no mês (faturamento novo)
  entradas: number; // recebimentos no mês de contratos antigos + receitas avulsas
  meta: number; // meta do mês (metas_mensais)
}

function buildMonths(inicio: Date | null, fim: Date | null) {
  const start = inicio ? startOfMonth(inicio) : startOfMonth(subMonths(new Date(), 11));
  const end = fim ? startOfMonth(fim) : startOfMonth(new Date());
  const meses: { key: string }[] = [];
  let cur = start;
  let guard = 0;
  while (cur <= end && guard < 36) {
    meses.push({ key: format(cur, "yyyy-MM") });
    cur = addMonths(cur, 1);
    guard++;
  }
  return meses;
}

/**
 * Série mensal para o gráfico de Faturamento, separando:
 *  - `novos`: valor dos contratos (acordos) criados no mês — faturamento novo.
 *  - `entradas`: recebimentos do mês vindos de contratos criados em meses
 *    anteriores + receitas avulsas (transações). Recebimentos de contratos
 *    criados no próprio mês não são somados aqui para não duplicar o valor
 *    já contado em `novos`.
 *  - `meta`: meta do mês (metas_mensais), exibida como linha para checar
 *    aderência.
 */
export function useFaturamentoMensal(filters?: FaturamentoFiltersState) {
  return useQuery({
    queryKey: ["faturamento-mensal", filters],
    queryFn: async (): Promise<FaturamentoMensalPonto[]> => {
      const { inicio, fim } = getDateRangeFromFilters(filters);
      const meses = buildMonths(inicio, fim);
      const map = new Map<string, FaturamentoMensalPonto>(
        meses.map((m) => [m.key, { mes: m.key, novos: 0, entradas: 0, meta: 0 }]),
      );

      // Contratos novos (acordos criados no mês).
      let acordosQuery = supabase
        .from("acordos_financeiros")
        .select("valor_total, created_at, status, tipo_servico, conta");
      if (filters?.status && filters.status !== "todos") {
        acordosQuery = acordosQuery.eq("status", filters.status);
      }
      if (filters?.tipoServico && filters.tipoServico !== "todos") {
        acordosQuery = acordosQuery.eq("tipo_servico", filters.tipoServico);
      }
      if (filters?.conta && filters.conta !== "todos") {
        acordosQuery = acordosQuery.eq("conta", filters.conta);
      }
      acordosQuery = applyDateRangeFromFilters(acordosQuery, "created_at", filters);
      const { data: acordos } = await acordosQuery.limit(10000);

      (acordos || []).forEach((a) => {
        const key = format(new Date(a.created_at), "yyyy-MM");
        const ponto = map.get(key);
        if (ponto) ponto.novos += Number(a.valor_total || 0);
      });

      // Entradas: parcelas pagas no mês de contratos criados antes.
      let parcelasQuery = supabase
        .from("parcelas_financeiras")
        .select("valor_pago, data_pagamento, acordo:acordos_financeiros!acordo_id(created_at)")
        .eq("status", "pago");
      parcelasQuery = applyDateRangeFromFilters(parcelasQuery, "data_pagamento", filters);
      const { data: parcelas } = await parcelasQuery.limit(10000);

      (parcelas || []).forEach((p: any) => {
        if (!p.data_pagamento) return;
        const key = format(new Date(p.data_pagamento), "yyyy-MM");
        const ponto = map.get(key);
        if (!ponto) return;
        const acordo = Array.isArray(p.acordo) ? p.acordo[0] : p.acordo;
        const criadoKey = acordo?.created_at
          ? format(new Date(acordo.created_at), "yyyy-MM")
          : null;
        // Só conta como "entrada de contrato existente" se o contrato foi
        // criado num mês anterior ao do pagamento (senão já está em `novos`).
        if (!criadoKey || criadoKey < key) {
          ponto.entradas += Number(p.valor_pago || 0);
        }
      });

      // Receitas avulsas (transações de receita) entram como entradas.
      let transQuery = supabase
        .from("transacoes_financeiras")
        .select("valor, data_transacao")
        .or("tipo_codigo.eq.receita,tipo_codigo.eq.REC");
      transQuery = applyDateRangeFromFilters(transQuery, "data_transacao", filters);
      const { data: transacoes } = await transQuery.limit(10000);

      (transacoes || []).forEach((t) => {
        if (!t.data_transacao) return;
        const key = format(new Date(t.data_transacao), "yyyy-MM");
        const ponto = map.get(key);
        if (ponto) ponto.entradas += Number(t.valor || 0);
      });

      // Metas mensais (linha).
      const { data: metas } = await supabase
        .from("metas_mensais")
        .select("mes, ano, valor");
      (metas || []).forEach((m: any) => {
        const key = `${m.ano}-${String(m.mes).padStart(2, "0")}`;
        const ponto = map.get(key);
        if (ponto) ponto.meta = Number(m.valor || 0);
      });

      return meses.map((m) => map.get(m.key)!);
    },
  });
}

export function useDistribuicaoTipo(filters?: FaturamentoFiltersState) {
  return useQuery({
    queryKey: ["distribuicao-tipo", filters],
    queryFn: async (): Promise<DistribuicaoTipo[]> => {
      let acordosQuery = supabase
        .from("acordos_financeiros")
        .select("tipo_servico, valor_total, created_at");

      // Filtrar por status se especificado
      if (filters?.status && filters.status !== "todos") {
        acordosQuery = acordosQuery.eq("status", filters.status);
      }

      // Push date filter server-side — antes baixava ate 10k registros e
      // filtrava em JS (silently truncava quando a base crescia).
      acordosQuery = applyDateRangeFromFilters(acordosQuery, "created_at", filters);

      const { data: acordos } = await acordosQuery.limit(10000);
      warnIfTruncated(acordos, "useDistribuicaoTipo/acordos");

      // Transacoes importadas — so receitas, e so dentro do intervalo.
      let transacoesQuery = supabase
        .from("transacoes_financeiras")
        .select("*")
        .or("tipo_codigo.eq.receita,tipo_codigo.eq.REC");
      transacoesQuery = applyDateRangeFromFilters(transacoesQuery, "data_transacao", filters);

      const { data: transacoes } = await transacoesQuery.limit(10000);
      warnIfTruncated(transacoes, "useDistribuicaoTipo/transacoes");

      const acordosFiltrados = acordos || [];
      const transacoesFiltradas = (transacoes || []).filter(
        (t) => !!t.data_transacao,
      );

      // Agrupar por mês e tipo para série temporal
      const serieTemporal: Record<string, Record<string, number>> = {};
      const todosTipos = new Set<string>();

      // Processar acordos
      acordosFiltrados.forEach(a => {
        const mes = format(new Date(a.created_at), "yyyy-MM");
        if (!serieTemporal[mes]) {
          serieTemporal[mes] = {};
        }
        const tipo = a.tipo_servico;
        todosTipos.add(tipo);
        serieTemporal[mes][tipo] = (serieTemporal[mes][tipo] || 0) + a.valor_total;
      });

      // Processar transações importadas
      transacoesFiltradas.forEach(t => {
        const mes = format(new Date(t.data_transacao!), "yyyy-MM");
        if (!serieTemporal[mes]) {
          serieTemporal[mes] = {};
        }
        const categoria = t.subcategoria_codigo || t.categoria_codigo || 'Importado';
        todosTipos.add(categoria);
        serieTemporal[mes][categoria] = (serieTemporal[mes][categoria] || 0) + (t.valor || 0);
      });

      // Converter para array ordenado por mês
      const resultado = Object.entries(serieTemporal)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, valores]) => ({
          mes,
          ...valores,
        }));

      // Retornar os tipos disponíveis como metadado
      return resultado.length > 0 ? resultado.map(r => ({
        ...r,
        _tipos: Array.from(todosTipos),
      })) : [];
    },
  });
}

// Hook para distribuição agregada (usado em relatórios)
export function useDistribuicaoTipoAgregado(filters?: FaturamentoFiltersState) {
  return useQuery({
    queryKey: ["distribuicao-tipo-agregado", filters],
    queryFn: async (): Promise<DistribuicaoTipoAgregado[]> => {
      let acordosQuery = supabase
        .from("acordos_financeiros")
        .select("tipo_servico, valor_total, created_at");

      if (filters?.status && filters.status !== "todos") {
        acordosQuery = acordosQuery.eq("status", filters.status);
      }

      acordosQuery = applyDateRangeFromFilters(acordosQuery, "created_at", filters);

      const { data: acordos } = await acordosQuery.limit(10000);
      warnIfTruncated(acordos, "useDistribuicaoTipoAgregado/acordos");

      let transacoesQuery = supabase
        .from("transacoes_financeiras")
        .select("*")
        .or("tipo_codigo.eq.receita,tipo_codigo.eq.REC");
      transacoesQuery = applyDateRangeFromFilters(transacoesQuery, "data_transacao", filters);

      const { data: transacoes } = await transacoesQuery.limit(10000);
      warnIfTruncated(transacoes, "useDistribuicaoTipoAgregado/transacoes");

      const acordosFiltrados = acordos || [];
      const transacoesFiltradas = (transacoes || []).filter(
        (t) => !!t.data_transacao,
      );

      const distribuicao: Record<string, { valor: number; quantidade: number }> = {};
      let totalValor = 0;

      acordosFiltrados.forEach(a => {
        if (!distribuicao[a.tipo_servico]) {
          distribuicao[a.tipo_servico] = { valor: 0, quantidade: 0 };
        }
        distribuicao[a.tipo_servico].valor += a.valor_total;
        distribuicao[a.tipo_servico].quantidade += 1;
        totalValor += a.valor_total;
      });

      transacoesFiltradas.forEach(t => {
        const categoria = t.subcategoria_codigo || t.categoria_codigo || 'Importado';
        if (!distribuicao[categoria]) {
          distribuicao[categoria] = { valor: 0, quantidade: 0 };
        }
        distribuicao[categoria].valor += t.valor || 0;
        distribuicao[categoria].quantidade += 1;
        totalValor += t.valor || 0;
      });

      return Object.entries(distribuicao).map(([tipo, dados]) => ({
        tipo,
        valor: dados.valor,
        quantidade: dados.quantidade,
        percentual: totalValor > 0 ? (dados.valor / totalValor) * 100 : 0,
      }));
    },
  });
}


export function useTopSubcategorias(limite: number = 5) {
  return useQuery({
    queryKey: ["top-subcategorias", limite],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select("subcategoria_codigo, valor")
        .or("tipo_codigo.eq.receita,tipo_codigo.eq.REC")
        .limit(10000);

      if (error) throw error;
      warnIfTruncated(data, "useTopSubcategorias");

      // Agrupar por subcategoria
      const agrupado: Record<string, { total: number; quantidade: number }> = {};
      
      (data || []).forEach(t => {
        const key = t.subcategoria_codigo || "Outros";
        if (!agrupado[key]) {
          agrupado[key] = { total: 0, quantidade: 0 };
        }
        agrupado[key].total += t.valor || 0;
        agrupado[key].quantidade += 1;
      });

      return Object.entries(agrupado)
        .map(([subcategoria, dados]) => ({
          subcategoria,
          total: dados.total,
          quantidade: dados.quantidade,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limite);
    },
  });
}

// Hook para receitas do mês atual por responsável
