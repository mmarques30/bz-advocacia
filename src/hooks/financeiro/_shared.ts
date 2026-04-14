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
