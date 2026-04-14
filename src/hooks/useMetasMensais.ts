import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";

export interface MetaMensal {
  id: string;
  mes: number;
  ano: number;
  valor: number;
  created_at: string;
  updated_at: string;
}

export function useMetasMensais() {
  const queryClient = useQueryClient();

  const { data: metas = [], isLoading } = useQuery({
    queryKey: ["metas-mensais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metas_mensais")
        .select("*")
        .order("ano", { ascending: false })
        .order("mes", { ascending: false });

      if (error) throw error;
      return data as MetaMensal[];
    },
  });

  const upsertMeta = useMutation({
    mutationFn: async ({ mes, ano, valor }: { mes: number; ano: number; valor: number }) => {
      // Check if meta exists
      const { data: existing } = await supabase
        .from("metas_mensais")
        .select("id")
        .eq("mes", mes)
        .eq("ano", ano)
        .single();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("metas_mensais")
          .update({ valor })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("metas_mensais")
          .insert({ mes, ano, valor });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas-mensais"] });
      queryClient.invalidateQueries({ queryKey: ["revenue"] });
      toast.success("Meta salva com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao salvar meta:", error);
      toast.error("Erro ao salvar meta");
    },
  });

  const deleteMeta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("metas_mensais")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas-mensais"] });
      queryClient.invalidateQueries({ queryKey: ["revenue"] });
      toast.success("Meta removida com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao remover meta:", error);
      toast.error("Erro ao remover meta");
    },
  });

  return {
    metas,
    isLoading,
    upsertMeta,
    deleteMeta,
  };
}

export function useMetaMensal(mes: number, ano: number) {
  return useQuery({
    queryKey: ["meta-mensal", mes, ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metas_mensais")
        .select("valor")
        .eq("mes", mes)
        .eq("ano", ano)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data?.valor || null;
    },
  });
}
