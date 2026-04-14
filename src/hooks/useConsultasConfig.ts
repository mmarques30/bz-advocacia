import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import type { ConsultasConfig } from "@/types/pesquisas";

export function useConsultasConfig() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["consultas-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultas_config")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as ConsultasConfig | null;
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (values: Partial<ConsultasConfig>) => {
      if (config?.id) {
        const { data, error } = await supabase
          .from("consultas_config")
          .update(values)
          .eq("id", config.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("consultas_config")
          .insert(values)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultas-config"] });
      toast.success("Configuração salva com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar configuração: " + error.message);
    },
  });

  const testarConexao = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("consultas-api", {
        body: { action: "test" },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Conexão estabelecida com sucesso!");
      } else {
        toast.error("Falha ao conectar: " + data.message);
      }
    },
    onError: (error: Error) => {
      toast.error("Erro ao testar conexão: " + error.message);
    },
  });

  return {
    config,
    isLoading,
    updateConfig,
    testarConexao,
  };
}
