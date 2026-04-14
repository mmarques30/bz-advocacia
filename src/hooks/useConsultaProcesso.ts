import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import type { ConsultaProcessoRequest, ConsultaProcessoResponse } from "@/types/pesquisas";

export function useConsultaProcesso() {
  const consultarProcesso = useMutation({
    mutationFn: async (data: ConsultaProcessoRequest): Promise<ConsultaProcessoResponse> => {
      const { data: result, error } = await supabase.functions.invoke(
        "consultas-datajud",
        { body: data }
      );

      if (error) {
        console.error("Erro na consulta Datajud:", error);
        throw new Error(error.message || "Erro ao consultar processo");
      }

      if (result?.error) {
        console.error("Erro retornado pela API:", result);
        throw new Error(result.error);
      }

      return result as ConsultaProcessoResponse;
    },
    onSuccess: () => {
      toast.success("Consulta realizada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro na mutation:", error);
      toast.error(error.message || "Erro ao consultar processo");
    },
  });

  return {
    consultarProcesso,
    isLoading: consultarProcesso.isPending,
    data: consultarProcesso.data,
    error: consultarProcesso.error,
    reset: consultarProcesso.reset,
  };
}
