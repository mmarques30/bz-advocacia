import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppHistorico, NotificacaoStatus } from "@/types/whatsapp";

interface HistoricoFilters {
  processo_id?: string;
  cliente_id?: string;
  status?: NotificacaoStatus;
  data_inicio?: string;
  data_fim?: string;
}

export function useWhatsAppHistorico(filters?: HistoricoFilters) {
  return useQuery({
    queryKey: ["whatsapp-historico", filters],
    queryFn: async () => {
      let query = supabase
        .from("whatsapp_historico")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.processo_id) {
        query = query.eq("processo_id", filters.processo_id);
      }

      if (filters?.cliente_id) {
        query = query.eq("cliente_id", filters.cliente_id);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.data_inicio) {
        query = query.gte("created_at", filters.data_inicio);
      }

      if (filters?.data_fim) {
        query = query.lte("created_at", filters.data_fim);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WhatsAppHistorico[];
    },
  });
}

export function useWhatsAppHistoricoProcesso(processoId: string) {
  return useWhatsAppHistorico({ processo_id: processoId });
}

export function useWhatsAppStats() {
  return useQuery({
    queryKey: ["whatsapp-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_historico")
        .select("status");

      if (error) throw error;

      const stats = {
        total: data.length,
        enviados: data.filter(h => h.status === 'enviado' || h.status === 'entregue' || h.status === 'lido').length,
        entregues: data.filter(h => h.status === 'entregue' || h.status === 'lido').length,
        lidos: data.filter(h => h.status === 'lido').length,
        falhas: data.filter(h => h.status === 'falhou').length,
        pendentes: data.filter(h => h.status === 'pendente').length,
      };

      return stats;
    },
  });
}
