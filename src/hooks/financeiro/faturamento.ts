/**
 * Hooks de faturamento: maiores pagadores e detalhamento.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/lib/toast";
import { format, subMonths, differenceInDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import type { FaturamentoFiltersState } from "@/components/financeiro/FaturamentoFilters";
import { getDateRangeFromFilters } from "./_shared";

import type { MaiorPagador } from "@/types/financeiro";

export function useMaioresPagadores(limite: number = 5) {
  return useQuery({
    queryKey: ["maiores-pagadores", limite],
    queryFn: async (): Promise<MaiorPagador[]> => {
      const { data, error } = await supabase
        .from("parcelas_financeiras")
        .select(`
          *,
          acordo:acordos_financeiros!acordo_id(
            id,
            cliente:contact_submissions!cliente_id(id, nome_completo)
          )
        `)
        .eq("status", "pago");

      if (error) throw error;

      // Agrupar por cliente
      const clientesMap: Record<string, { nome: string; total: number; quantidade: number }> = {};

      (data || []).forEach(p => {
        const cliente = (p.acordo as any)?.cliente?.[0];
        if (!cliente) return;

        if (!clientesMap[cliente.id]) {
          clientesMap[cliente.id] = {
            nome: cliente.nome_completo,
            total: 0,
            quantidade: 0,
          };
        }

        clientesMap[cliente.id].total += p.valor_pago || 0;
        clientesMap[cliente.id].quantidade += 1;
      });

      return Object.entries(clientesMap)
        .map(([id, dados]) => ({
          cliente_id: id,
          cliente_nome: dados.nome,
          total_pago: dados.total,
          quantidade_pagamentos: dados.quantidade,
        }))
        .sort((a, b) => b.total_pago - a.total_pago)
        .slice(0, limite);
    },
  });
}

// Hook para buscar faturamento detalhado (receitas de transacoes_financeiras)
interface FaturamentoDetalhadoItem {
  id: string;
  data: string | null;
  descricao: string | null;
  categoria: string | null;
  subcategoria: string | null;
  valor: number;
  conta: string | null;
}

export function useFaturamentoDetalhado(filters?: FaturamentoFiltersState) {
  return useQuery({
    queryKey: ["faturamento-detalhado", filters],
    queryFn: async (): Promise<FaturamentoDetalhadoItem[]> => {
      const { inicio, fim } = getDateRangeFromFilters(filters);

      // Buscar transações de receita
      const { data: transacoes, error } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .order("data_transacao", { ascending: false })
        .limit(10000);

      if (error) throw error;

      // Filtrar por tipo receita e período (se houver filtros)
      const transacoesFiltradas = (transacoes || []).filter(t => {
        if (!t.data_transacao) return false;
        const dataTransacao = new Date(t.data_transacao);
        const tipoReceita = t.tipo_codigo === 'receita' || t.tipo_codigo === 'REC';
        
        if (!tipoReceita) return false;
        
        // Se não houver filtros de data, incluir todas as receitas
        if (!inicio && !fim) return true;
        if (inicio && dataTransacao < inicio) return false;
        if (fim && dataTransacao > fim) return false;
        return true;
      });

      return transacoesFiltradas.map(t => ({
        id: t.id,
        data: t.data_transacao,
        descricao: t.descricao,
        categoria: t.categoria_codigo,
        subcategoria: t.subcategoria_codigo,
        valor: t.valor || 0,
        conta: t.conta || null,
        // Campos completos para edição
        mes: t.mes,
        ano: t.ano,
        mes_nome: t.mes_nome,
        tipo_codigo: t.tipo_codigo,
        categoria_codigo: t.categoria_codigo,
        subcategoria_codigo: t.subcategoria_codigo,
        data_transacao: t.data_transacao,
        created_at: t.created_at,
      }));
    },
  });
}

// Hook para buscar receitas recentes
