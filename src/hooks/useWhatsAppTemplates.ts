import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppTemplate, TemplateCategoria, TemplateTipo } from "@/types/whatsapp";
import { toast } from "@/hooks/use-toast";

interface TemplateFilters {
  busca?: string;
  categoria?: TemplateCategoria;
  tipo?: TemplateTipo;
  ativo?: boolean;
}

export function useWhatsAppTemplates(filters?: TemplateFilters) {
  return useQuery({
    queryKey: ["whatsapp-templates", filters],
    queryFn: async () => {
      let query = supabase
        .from("whatsapp_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.busca) {
        query = query.ilike("nome", `%${filters.busca}%`);
      }

      if (filters?.categoria) {
        query = query.eq("categoria", filters.categoria);
      }

      if (filters?.ativo !== undefined) {
        query = query.eq("ativo", filters.ativo);
      }

      if (filters?.tipo) {
        query = query.eq("tipo", filters.tipo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WhatsAppTemplate[];
    },
  });
}

export function useWhatsAppTemplate(id: string) {
  return useQuery({
    queryKey: ["whatsapp-template", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as WhatsAppTemplate;
    },
    enabled: !!id,
  });
}

export function useCreateWhatsAppTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Partial<WhatsAppTemplate>) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("whatsapp_templates")
        .insert({
          ...template,
          criado_por: user?.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      toast({
        title: "Template criado",
        description: "O template foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar template",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateWhatsAppTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WhatsAppTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("whatsapp_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      toast({
        title: "Template atualizado",
        description: "O template foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar template",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteWhatsAppTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("whatsapp_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      toast({
        title: "Template excluído",
        description: "O template foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir template",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useToggleWhatsAppTemplateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from("whatsapp_templates")
        .update({ ativo })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      toast({
        title: "Status atualizado",
        description: "O status do template foi atualizado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
