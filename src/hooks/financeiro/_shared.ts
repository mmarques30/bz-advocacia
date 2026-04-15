/**
 * Helpers e imports compartilhados pelos sub-modulos de hooks financeiros.
 *
 * Historicamente tudo vivia em src/hooks/useFinanceiro.ts (963+ linhas).
 * Na Rodada 4 do refactor, o arquivo foi quebrado em sub-modulos por
 * dominio (kpis, acordos, receitas, etc.) e useFinanceiro.ts virou um
 * barrel que re-exporta tudo para preservar os imports existentes.
 */

import type { FaturamentoFiltersState } from "@/components/financeiro/FaturamentoFilters";

/**
 * Normaliza o intervalo de datas vindo do filtro global. Retorna
 * null/null quando nao ha periodo definido (os callers interpretam
 * como "buscar tudo").
 */
export function getDateRangeFromFilters(
  filters?: FaturamentoFiltersState,
): { inicio: Date | null; fim: Date | null } {
  if (!filters || (!filters.dateRange?.from && !filters.dateRange?.to)) {
    return { inicio: null, fim: null };
  }

  if (filters.dateRange?.from && filters.dateRange?.to) {
    return { inicio: filters.dateRange.from, fim: filters.dateRange.to };
  }

  if (filters.dateRange?.from) {
    return { inicio: filters.dateRange.from, fim: null };
  }

  if (filters.dateRange?.to) {
    return { inicio: null, fim: filters.dateRange.to };
  }

  return { inicio: null, fim: null };
}

/**
 * Aplica .gte/.lte na coluna de data indicada, usando o mesmo range que
 * o getDateRangeFromFilters. Retorna a query encadeavel para chaining.
 *
 * Motivacao: historicamente os hooks de distribuicao/kpi baixavam ate
 * 10k registros com `.limit(10000)` e filtravam client-side. Isso vira
 * um bug silencioso quando a base cresce (relatorio "perde" registros
 * para alem do limite). Empurrando o filtro para o Postgres, o resultado
 * fica correto e o payload muito menor.
 *
 * Semantica preservada: `new Date(row.col) >= inicio` equivale a
 * `.gte(col, inicio.toISOString())` em termos de comparacao de instante
 * (ambos comparam em UTC millis), entao o filtro server-side nao muda
 * o resultado em relacao ao filtro JS que existia antes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyDateRangeFromFilters<Q extends { gte: (col: string, v: string) => any; lte: (col: string, v: string) => any }>(
  query: Q,
  column: string,
  filters?: FaturamentoFiltersState,
): Q {
  const { inicio, fim } = getDateRangeFromFilters(filters);
  let q = query;
  if (inicio) q = q.gte(column, inicio.toISOString());
  if (fim) q = q.lte(column, fim.toISOString());
  return q;
}
