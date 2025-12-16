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

  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("meta-auth", {
        body: { action: "get_auth_url" },
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.authUrl) {
        // Store state for verification
        sessionStorage.setItem("meta_oauth_state", data.state);
        // Redirect to Meta OAuth
        window.location.href = data.authUrl;
      }

      return data;
    },
    onError: (error) => {
      toast.error("Erro ao conectar: " + error.message);
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
    connect: connectMutation.mutate,
    isConnecting: connectMutation.isPending,
    disconnect: disconnectMutation.mutate,
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
  };
}
