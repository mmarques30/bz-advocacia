import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";

export interface SenhaSistema {
  id: string;
  titulo: string;
  url: string | null;
  usuario: string | null;
  senha: string;
  categoria: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const useSenhasSistema = () => {
  return useQuery({
    queryKey: ["senhas-sistema"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("senhas_sistema")
        .select("*")
        .order("categoria")
        .order("titulo");
      if (error) throw error;
      return data as SenhaSistema[];
    },
  });
};

export const useCreateSenha = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { titulo: string; url?: string; usuario?: string; senha: string; categoria?: string; observacoes?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("senhas_sistema").insert({
        ...data,
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["senhas-sistema"] });
      toast.success("Senha adicionada com sucesso");
    },
    onError: (e: Error) => toast.error("Erro ao adicionar: " + e.message),
  });
};

export const useUpdateSenha = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; titulo?: string; url?: string; usuario?: string; senha?: string; categoria?: string; observacoes?: string }) => {
      const { error } = await supabase.from("senhas_sistema").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["senhas-sistema"] });
      toast.success("Senha atualizada");
    },
    onError: (e: Error) => toast.error("Erro ao atualizar: " + e.message),
  });
};

export const useDeleteSenha = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("senhas_sistema").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["senhas-sistema"] });
      toast.success("Senha removida");
    },
    onError: (e: Error) => toast.error("Erro ao remover: " + e.message),
  });
};
