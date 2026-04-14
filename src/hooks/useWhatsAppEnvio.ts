import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EnviarMensagemParams } from "@/types/whatsapp";
import { toast } from "@/lib/toast";

export function useEnviarWhatsApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: EnviarMensagemParams) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: params,
      });

      if (error) {
        // Try to extract meaningful error message from response
        const errorMsg = (data as any)?.erro || error.message || 'Erro ao enviar mensagem';
        throw new Error(errorMsg);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-historico"] });
      toast({
        title: "Mensagem enviada",
        description: "A mensagem foi enviada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
