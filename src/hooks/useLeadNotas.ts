import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeadNota } from "@/types/leads";
import { toast } from "@/hooks/use-toast";

export function useLeadNotas(leadId: string) {
  return useQuery({
    queryKey: ["lead-notas", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_notas")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LeadNota[];
    },
  });
}

export function useCreateNota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nota: { lead_id: string; texto: string; usuario_id: string }) => {
      const { data, error } = await supabase
        .from("lead_notas")
        .insert([nota])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-notas"] });
      toast({
        title: "Nota adicionada",
        description: "A nota foi adicionada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar nota",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateNota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, texto }: { id: string; texto: string }) => {
      const { data, error } = await supabase
        .from("lead_notas")
        .update({ texto, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-notas"] });
      toast({
        title: "Nota atualizada",
        description: "A nota foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar nota",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteNota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lead_notas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-notas"] });
      toast({
        title: "Nota excluída",
        description: "A nota foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir nota",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
