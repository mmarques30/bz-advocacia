import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetaConnection } from "@/types/meta-ads";
import { toast } from "sonner";

export function useMetaConnection() {
  const queryClient = useQueryClient();

  const { data: connection, isLoading } = useQuery({
    queryKey: ["meta-connection"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meta_connections")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as MetaConnection | null;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from("meta_connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meta-connection"] });
      toast.success("Desconectado do Meta Ads com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao desconectar: " + error.message);
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      // Chamará edge function para sincronizar quando credenciais estiverem disponíveis
      const { data, error } = await supabase.functions.invoke("meta-metrics", {
        body: { action: "sync" },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meta-connection"] });
      queryClient.invalidateQueries({ queryKey: ["meta-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["meta-campaigns"] });
      toast.success("Dados sincronizados com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao sincronizar: " + error.message);
    },
  });

  return {
    connection,
    isLoading,
    isConnected: !!connection,
    disconnect: disconnectMutation.mutate,
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
  };
}
