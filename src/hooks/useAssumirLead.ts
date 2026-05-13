import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";

async function resolverAdvogadoId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();

  // a) mapeamento por auth user_id (se existir coluna user_id em advogados_sdr)
  if (user?.id) {
    const { data: meu } = await supabase
      .from("advogados_sdr" as any)
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (meu && (meu as any).id) return (meu as any).id;
  }

  // b) fallback: primeiro advogado com 'geral' nas areas
  const { data: geral } = await supabase
    .from("advogados_sdr" as any)
    .select("id, areas")
    .contains("areas", ["geral"] as any)
    .limit(1)
    .maybeSingle();
  if (geral && (geral as any).id) return (geral as any).id;

  // c) último fallback: qualquer advogado
  const { data: qualquer } = await supabase
    .from("advogados_sdr" as any)
    .select("id")
    .limit(1)
    .maybeSingle();
  return (qualquer as any)?.id ?? null;
}

export function useAssumirLead() {
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Você assumiu este lead. Mensagem enviada ao cliente.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao assumir lead");
    },
  });
}
