import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LogSistema {
  id: string;
  usuario_id?: string;
  acao: string;
  entidade_tipo: string;
  entidade_id?: string;
  descricao: string;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  profiles?: {
    nome_completo: string;
    email: string;
  };
}

export const useLogs = (filters?: {
  usuarioId?: string;
  acao?: string;
  entidadeTipo?: string;
  dataInicio?: Date;
  dataFim?: Date;
}) => {
  return useQuery({
    queryKey: ["logs-sistema", filters],
    queryFn: async () => {
      let query = supabase
        .from("logs_sistema")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters?.usuarioId) {
        query = query.eq("usuario_id", filters.usuarioId);
      }

      if (filters?.acao) {
        query = query.eq("acao", filters.acao);
      }

      if (filters?.entidadeTipo) {
        query = query.eq("entidade_tipo", filters.entidadeTipo);
      }

      if (filters?.dataInicio) {
        query = query.gte("created_at", filters.dataInicio.toISOString());
      }

      if (filters?.dataFim) {
        query = query.lte("created_at", filters.dataFim.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as LogSistema[];
    },
  });
};

export const useLogDetails = (logId: string) => {
  return useQuery({
    queryKey: ["log-details", logId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("logs_sistema")
        .select("*")
        .eq("id", logId)
        .single();

      if (error) throw error;
      return data as LogSistema;
    },
    enabled: !!logId,
  });
};
