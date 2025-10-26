import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Template {
  id: string;
  nome: string;
  tipo: "documento" | "email" | "whatsapp" | "contrato";
  categoria?: string;
  conteudo: string;
  variaveis?: string[];
  descricao?: string;
  ativo: boolean;
  criado_por?: string;
  created_at: string;
  updated_at: string;
}

export const useTemplates = (tipo?: string) => {
  return useQuery({
    queryKey: ["templates", tipo],
    queryFn: async () => {
      let query = supabase
        .from("templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (tipo) {
        query = query.eq("tipo", tipo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Template[];
    },
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Partial<Template>) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("templates")
        .insert([{
          nome: template.nome!,
          tipo: template.tipo!,
          conteudo: template.conteudo!,
          categoria: template.categoria,
          descricao: template.descricao,
          variaveis: template.variaveis,
          ativo: template.ativo ?? true,
          criado_por: userData.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template criado com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar template: " + error.message);
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Template> & { id: string }) => {
      const { data: updated, error } = await supabase
        .from("templates")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template atualizado com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar template: " + error.message);
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template excluído com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir template: " + error.message);
    },
  });
};

export const useDuplicateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: original, error: fetchError } = await supabase
        .from("templates")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("templates")
        .insert({
          ...original,
          id: undefined,
          nome: `${original.nome} (Cópia)`,
          criado_por: userData.user?.id,
          created_at: undefined,
          updated_at: undefined,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template duplicado com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao duplicar template: " + error.message);
    },
  });
};
