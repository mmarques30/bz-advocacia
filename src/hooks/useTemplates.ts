import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Template, TemplateFilters, TemplateFormData } from "@/types/templates";

export const useTemplates = (filters?: TemplateFilters) => {
  return useQuery({
    queryKey: ["templates", filters],
    queryFn: async () => {
      let query = supabase
        .from("templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.busca) {
        query = query.or(`nome.ilike.%${filters.busca}%,descricao.ilike.%${filters.busca}%`);
      }

      if (filters?.tipo && filters.tipo.length > 0) {
        query = query.in("tipo", filters.tipo);
      }

      if (filters?.categoria) {
        query = query.eq("categoria", filters.categoria);
      }

      if (filters?.ativo !== null && filters?.ativo !== undefined) {
        query = query.eq("ativo", filters.ativo);
      }

      const { data, error } = await query;

      if (error) throw error;

      let templates = data as Template[];

      // Apply sorting
      if (filters?.ordenacao) {
        switch (filters.ordenacao) {
          case 'recente':
            templates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            break;
          case 'antigo':
            templates.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            break;
          case 'az':
            templates.sort((a, b) => a.nome.localeCompare(b.nome));
            break;
          case 'za':
            templates.sort((a, b) => b.nome.localeCompare(a.nome));
            break;
        }
      }

      return templates;
    },
  });
};

export const useTemplate = (id: string) => {
  return useQuery({
    queryKey: ["template", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Template;
    },
    enabled: !!id,
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: TemplateFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("templates")
        .insert({
          ...template,
          criado_por: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar template: " + error.message);
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...template }: Partial<Template> & { id: string }) => {
      const { data, error } = await supabase
        .from("templates")
        .update(template)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template atualizado com sucesso!");
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
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template desativado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao desativar template: " + error.message);
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

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("templates")
        .insert({
          nome: `${original.nome} (Cópia)`,
          tipo: original.tipo,
          categoria: original.categoria,
          conteudo: original.conteudo,
          variaveis: original.variaveis,
          descricao: original.descricao,
          ativo: true,
          criado_por: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template duplicado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao duplicar template: " + error.message);
    },
  });
};

export const useToggleTemplateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("templates")
        .update({ ativo })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success(`Template ${variables.ativo ? 'ativado' : 'desativado'} com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error("Erro ao alterar status do template: " + error.message);
    },
  });
};
