import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Tag {
  id: string;
  nome: string;
  cor: string;
  tipo: "lead" | "processo" | "geral";
  descricao?: string;
  created_by?: string;
  created_at: string;
  uso_count?: number;
}

export const useTags = (tipo?: string) => {
  return useQuery({
    queryKey: ["tags", tipo],
    queryFn: async () => {
      let query = supabase
        .from("tags")
        .select(`
          *,
          entidade_tags(count)
        `)
        .order("created_at", { ascending: false });

      if (tipo) {
        query = query.eq("tipo", tipo);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((tag: any) => ({
        ...tag,
        uso_count: tag.entidade_tags?.[0]?.count || 0,
        entidade_tags: undefined,
      })) as Tag[];
    },
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tag: Partial<Tag>) => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("tags")
        .insert([{
          nome: tag.nome!,
          cor: tag.cor!,
          tipo: tag.tipo!,
          descricao: tag.descricao,
          created_by: userData.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag criada com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar tag: " + error.message);
    },
  });
};

export const useUpdateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Tag> & { id: string }) => {
      const { data: updated, error } = await supabase
        .from("tags")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag atualizada com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar tag: " + error.message);
    },
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag excluída com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir tag: " + error.message);
    },
  });
};

export const useEntityTags = (entidadeId: string, entidadeTipo: "lead" | "processo") => {
  return useQuery({
    queryKey: ["entity-tags", entidadeId, entidadeTipo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entidade_tags")
        .select("*, tags(*)")
        .eq("entidade_id", entidadeId)
        .eq("entidade_tipo", entidadeTipo);

      if (error) throw error;
      return data.map((et: any) => et.tags) as Tag[];
    },
    enabled: !!entidadeId,
  });
};

export const useAddTagToEntity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tagId,
      entidadeId,
      entidadeTipo,
    }: {
      tagId: string;
      entidadeId: string;
      entidadeTipo: "lead" | "processo";
    }) => {
      const { error } = await supabase.from("entidade_tags").insert({
        tag_id: tagId,
        entidade_id: entidadeId,
        entidade_tipo: entidadeTipo,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-tags"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag adicionada");
    },
    onError: (error: Error) => {
      toast.error("Erro ao adicionar tag: " + error.message);
    },
  });
};

export const useRemoveTagFromEntity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tagId,
      entidadeId,
      entidadeTipo,
    }: {
      tagId: string;
      entidadeId: string;
      entidadeTipo: "lead" | "processo";
    }) => {
      const { error } = await supabase
        .from("entidade_tags")
        .delete()
        .eq("tag_id", tagId)
        .eq("entidade_id", entidadeId)
        .eq("entidade_tipo", entidadeTipo);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-tags"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag removida");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover tag: " + error.message);
    },
  });
};
