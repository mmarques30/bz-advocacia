import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { HistoricoPagamento } from "@/types/financeiro";

export function useHistoricoPagamentos(parcelaId: string | null) {
  return useQuery({
    queryKey: ["historico-pagamentos", parcelaId],
    enabled: !!parcelaId,
    queryFn: async (): Promise<HistoricoPagamento[]> => {
      if (!parcelaId) return [];

      const { data, error } = await supabase
        .from("historico_pagamentos")
        .select("*")
        .eq("parcela_id", parcelaId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useHistoricoPagamentosAcordo(acordoId: string | null) {
  return useQuery({
    queryKey: ["historico-pagamentos-acordo", acordoId],
    enabled: !!acordoId,
    queryFn: async (): Promise<HistoricoPagamento[]> => {
      if (!acordoId) return [];

      // Buscar todas as parcelas do acordo
      const { data: parcelas } = await supabase
        .from("parcelas_financeiras")
        .select("id")
        .eq("acordo_id", acordoId);

      if (!parcelas || parcelas.length === 0) return [];

      const parcelaIds = parcelas.map(p => p.id);

      const { data, error } = await supabase
        .from("historico_pagamentos")
        .select(`
          *,
          parcela:parcelas_financeiras!parcela_id(numero_parcela)
        `)
        .in("parcela_id", parcelaIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}
