/**
 * Hooks de distribuicao por tipo de servico e subcategoria.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/lib/toast";
import { format, subMonths, differenceInDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import type { FaturamentoFiltersState } from "@/components/financeiro/FaturamentoFilters";
import { getDateRangeFromFilters } from "./_shared";

import type { DistribuicaoTipo, DistribuicaoTipoAgregado } from "@/types/financeiro";

export function useDistribuicaoTipo(filters?: FaturamentoFiltersState) {
  return useQuery({
    queryKey: ["distribuicao-tipo", filters],
    queryFn: async (): Promise<DistribuicaoTipo[]> => {
      let query = supabase
        .from("acordos_financeiros")
        .select("tipo_servico, valor_total, created_at");

      // Filtrar por status se especificado
      if (filters?.status && filters.status !== "todos") {
        query = query.eq("status", filters.status);
      }

      const { data: acordos } = await query.limit(10000);

      // Buscar transações importadas
      const { data: transacoes } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .limit(10000);

      // Filtrar por período se especificado
      const { inicio, fim } = getDateRangeFromFilters(filters);
      const acordosFiltrados = acordos?.filter(a => {
        const dataAcordo = new Date(a.created_at);
        if (inicio && dataAcordo < inicio) return false;
        if (fim && dataAcordo > fim) return false;
        return true;
      }) || [];

      const transacoesFiltradas = transacoes?.filter(t => {
        if (!t.data_transacao) return false;
        const dataTransacao = new Date(t.data_transacao);
        const tipoReceita = t.tipo_codigo === 'receita' || t.tipo_codigo === 'REC';
        if (!tipoReceita) return false;
        if (inicio && dataTransacao < inicio) return false;
        if (fim && dataTransacao > fim) return false;
        return true;
      }) || [];

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
      let query = supabase
        .from("acordos_financeiros")
        .select("tipo_servico, valor_total, created_at");

      if (filters?.status && filters.status !== "todos") {
        query = query.eq("status", filters.status);
      }

      const { data: acordos } = await query.limit(10000);

      const { data: transacoes } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .limit(10000);

      const { inicio, fim } = getDateRangeFromFilters(filters);
      const acordosFiltrados = acordos?.filter(a => {
        const dataAcordo = new Date(a.created_at);
        if (inicio && dataAcordo < inicio) return false;
        if (fim && dataAcordo > fim) return false;
        return true;
      }) || [];

      const transacoesFiltradas = transacoes?.filter(t => {
        if (!t.data_transacao) return false;
        const dataTransacao = new Date(t.data_transacao);
        const tipoReceita = t.tipo_codigo === 'receita' || t.tipo_codigo === 'REC';
        if (!tipoReceita) return false;
        if (inicio && dataTransacao < inicio) return false;
        if (fim && dataTransacao > fim) return false;
        return true;
      }) || [];

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
