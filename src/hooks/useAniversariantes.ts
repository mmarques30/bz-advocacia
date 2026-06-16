import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Aniversariante } from "@/hooks/useDashboardVisual";

export function useAniversariantes() {
  return useQuery({
    queryKey: ["aniversariantes-mes"],
    queryFn: async (): Promise<Aniversariante[]> => {
      const hoje = new Date();
      const mesAtual = hoje.getMonth() + 1;
      const diaAtual = hoje.getDate();

      const { data } = await supabase
        .from("contact_submissions")
        .select("id, nome_completo, data_nascimento, telefone, lead_geral_id")
        .eq("estagio", "fechado")
        .not("data_nascimento", "is", null);

      return (data || [])
        .filter((c) => {
          if (!c.data_nascimento) return false;
          const [, m] = c.data_nascimento.split("-").map(Number);
          return m === mesAtual;
        })
        .map((c) => {
          const [, , d] = c.data_nascimento!.split("-").map(Number);
          const isHoje = d === diaAtual;
          const diasAte = d >= diaAtual ? d - diaAtual : 999;
          // nome_completo pode vir null em registros antigos. Garante string
          // pra getIniciais e renders nao quebrarem o layout do avatar.
          const nome = (c.nome_completo ?? "Sem nome").trim() || "Sem nome";
          return {
            id: c.id,
            nome,
            data_nascimento: c.data_nascimento!,
            dia: d,
            telefone: c.telefone,
            isHoje,
            diasAte,
            lead_geral_id: (c as any).lead_geral_id ?? null,
          };
        })
        .sort((a, b) => a.dia - b.dia);
    },
    refetchInterval: 10 * 60 * 1000,
  });
}
