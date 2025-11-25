import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ConsultaPessoaRequest, ConsultaPessoaResponse } from "@/types/pesquisas";

export function useConsultaPessoa() {
  const queryClient = useQueryClient();

  const consultarPessoa = useMutation({
    mutationFn: async (request: ConsultaPessoaRequest) => {
      const { data, error } = await supabase.functions.invoke("consultas-pessoa", {
        body: request,
      });

      if (error) throw error;
      return data as ConsultaPessoaResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historico-consultas"] });
      toast.success("Consulta realizada com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao localizar pessoa: " + error.message);
    },
  });

  return {
    consultarPessoa,
    isLoading: consultarPessoa.isPending,
  };
}
