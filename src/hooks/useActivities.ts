import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeadAtividade } from "@/types/leads";
import { toast } from "@/hooks/use-toast";

export function useLeadActivities(leadId: string) {
  return useQuery({
    queryKey: ["lead-activities", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades")
        .select("*")
        .eq("entidade_id", leadId)
        .eq("entidade_tipo", "lead")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LeadAtividade[];
    },
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: {
      tipo: string;
      descricao: string;
      entidade_tipo: string;
      entidade_id: string;
      usuario_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("atividades")
        .insert([activity])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-activities"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar atividade",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
