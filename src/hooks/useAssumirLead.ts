import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import { resolverAdvogadoId } from "@/lib/advogadoSdr";

interface UseAssumirLeadOptions {
  onAssumed?: (leadGeralId: string) => void;
}

export function useAssumirLead(options: UseAssumirLeadOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadGeralId: string) => {
      if (!leadGeralId) throw new Error("Lead sem vínculo com bot SDR");

      const advogadoId = await resolverAdvogadoId();
      if (!advogadoId) throw new Error("Nenhum advogado disponível para receber o lead");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada — faça login novamente");

      const { data, error } = await supabase.functions.invoke("assumir-conversa", {
        body: {
          lead_id: leadGeralId,
          advogado_id: advogadoId,
          enviar_transicao: true,
        },
      });
      if (error) throw error;
      return { ...data, leadGeralId };
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Você assumiu este lead. Mensagem enviada ao cliente.");
      if (data?.leadGeralId) options.onAssumed?.(data.leadGeralId);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao assumir lead");
    },
  });
}
