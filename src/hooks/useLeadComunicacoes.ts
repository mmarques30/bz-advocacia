import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeadComunicacao } from "@/types/leads";
import { toast } from "@/hooks/use-toast";

export function useLeadComunicacoes(leadId: string) {
  return useQuery({
    queryKey: ["lead-comunicacoes", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_comunicacoes")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LeadComunicacao[];
    },
  });
}

export function useCreateComunicacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comunicacao: {
      lead_id: string;
      tipo: 'email' | 'whatsapp' | 'ligacao';
      template_usado?: string;
      mensagem: string;
      status?: 'enviado' | 'entregue' | 'lido' | 'erro';
      enviado_por?: string;
    }) => {
      const { data, error } = await supabase
        .from("lead_comunicacoes")
        .insert([comunicacao])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-comunicacoes"] });
      toast({
        title: "Comunicação registrada",
        description: "A comunicação foi registrada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar comunicação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
