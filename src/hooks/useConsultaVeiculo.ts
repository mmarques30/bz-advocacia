import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ConsultaVeiculoRequest, ConsultaVeiculoResponse } from "@/types/pesquisas";

export function useConsultaVeiculo() {
  const queryClient = useQueryClient();

  const consultarVeiculo = useMutation({
    mutationFn: async (request: ConsultaVeiculoRequest) => {
      const { data, error } = await supabase.functions.invoke("consultas-veiculo", {
        body: request,
      });

      if (error) throw error;
      return data as ConsultaVeiculoResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historico-consultas"] });
      toast.success("Consulta realizada com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao consultar veículo: " + error.message);
    },
  });

  return {
    consultarVeiculo,
    isLoading: consultarVeiculo.isPending,
  };
}
