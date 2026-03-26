import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Treinamento {
  id: string;
  titulo: string;
  descricao: string | null;
  drive_url: string;
  categoria: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  created_by: string | null;
}

export const useTreinamentos = () => {
  return useQuery({
    queryKey: ["treinamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treinamentos")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Treinamento[];
    },
  });
};

export const useCreateTreinamento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { titulo: string; descricao?: string; drive_url: string; categoria?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("treinamentos").insert({
        ...data,
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treinamentos"] });
      toast.success("Treinamento adicionado com sucesso");
    },
    onError: (e: Error) => toast.error("Erro ao adicionar: " + e.message),
  });
};

export const useUpdateTreinamento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; titulo?: string; descricao?: string; drive_url?: string; categoria?: string }) => {
      const { error } = await supabase.from("treinamentos").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treinamentos"] });
      toast.success("Treinamento atualizado");
    },
    onError: (e: Error) => toast.error("Erro ao atualizar: " + e.message),
  });
};

export const useDeleteTreinamento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("treinamentos").update({ ativo: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treinamentos"] });
      toast.success("Treinamento removido");
    },
    onError: (e: Error) => toast.error("Erro ao remover: " + e.message),
  });
};
