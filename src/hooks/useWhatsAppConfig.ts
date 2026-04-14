import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppConfig } from "@/types/whatsapp";
import { toast } from "@/lib/toast";

export function useWhatsAppConfig() {
  return useQuery({
    queryKey: ["whatsapp-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_config")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data as WhatsAppConfig | null;
    },
  });
}

export function useCreateOrUpdateWhatsAppConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<WhatsAppConfig>) => {
      // Verificar se já existe config
      const { data: existing } = await supabase
        .from("whatsapp_config")
        .select("id")
        .maybeSingle();

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from("whatsapp_config")
          .update(config as any)
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from("whatsapp_config")
          .insert(config as any)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] });
      toast({
        title: "Configuração salva",
        description: "A configuração do WhatsApp foi salva com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useTestWhatsAppConnection() {
  return useMutation({
    mutationFn: async (config: Partial<WhatsAppConfig>) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-test-connection', {
        body: config,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Conexão bem-sucedida",
        description: "A conexão com o WhatsApp foi testada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao testar conexão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
