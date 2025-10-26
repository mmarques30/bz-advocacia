import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProcessoHistorico } from "@/types/processos";

export function useProcessoHistorico(processoId: string) {
  return useQuery({
    queryKey: ["processo-historico", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processos_historico")
        .select("*")
        .eq("processo_id", processoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProcessoHistorico[];
    },
    enabled: !!processoId,
  });
}
