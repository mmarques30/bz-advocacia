import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export function useCreateHistorico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (historico: {
      processo_id: string;
      entidade_tipo: string;
      entidade_id?: string;
      acao: string;
      campo_alterado?: string;
      valor_anterior?: string;
      valor_novo?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("processos_historico")
        .insert({
          ...historico,
          usuario_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-historico"] });
    },
  });
}

