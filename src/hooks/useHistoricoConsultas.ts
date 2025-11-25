import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ConsultaRealizada, HistoricoFilters } from "@/types/pesquisas";

export function useHistoricoConsultas(filters?: HistoricoFilters) {
  return useQuery({
    queryKey: ["historico-consultas", filters],
    queryFn: async () => {
      let query = supabase
        .from("consultas_realizadas")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.tipo) {
        query = query.eq("tipo_consulta", filters.tipo);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.usuario_id) {
        query = query.eq("usuario_id", filters.usuario_id);
      }

      if (filters?.processo_id) {
        query = query.eq("processo_id", filters.processo_id);
      }

      if (filters?.dataInicio) {
        query = query.gte("created_at", filters.dataInicio);
      }

      if (filters?.dataFim) {
        query = query.lte("created_at", filters.dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ConsultaRealizada[];
    },
  });
}
