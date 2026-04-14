import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import type { ConsultaImovelRequest, ConsultaImovelResponse } from "@/types/pesquisas";

export function useConsultaImovel() {
  const queryClient = useQueryClient();

  const consultarImovel = useMutation({
    mutationFn: async (request: ConsultaImovelRequest) => {
      const { data, error } = await supabase.functions.invoke("consultas-imovel", {
        body: request,
      });

      if (error) throw error;
      return data as ConsultaImovelResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historico-consultas"] });
      toast.success("Consulta realizada com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao consultar imóvel: " + error.message);
    },
  });

  return {
    consultarImovel,
    isLoading: consultarImovel.isPending,
  };
}
