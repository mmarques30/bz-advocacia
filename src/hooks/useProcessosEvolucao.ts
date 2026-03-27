import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths, format, endOfMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ProcessoEvolucaoMes {
  mes: string;
  abertos: number;
  concluidos: number;
  acumulado: number;
}

export interface ProcessosEvolucaoData {
  meses: ProcessoEvolucaoMes[];
  abertos30d: number;
  variacao: number;
}

export function useProcessosEvolucao() {
  return useQuery<ProcessosEvolucaoData>({
    queryKey: ["processos-evolucao"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const hoje = new Date();
      const inicio = startOfMonth(subMonths(hoje, 5));

      const { data: processos, error } = await supabase
        .from("processos")
        .select("id, created_at, status, data_ultima_atualizacao")
        .gte("created_at", inicio.toISOString());

      if (error) throw error;

      // Also fetch older processes to calculate cumulative
      const { data: allProcessos, error: err2 } = await supabase
        .from("processos")
        .select("id, created_at, status, data_ultima_atualizacao")
        .lt("created_at", inicio.toISOString());

      if (err2) throw err2;

      // Build 6 months
      const meses: ProcessoEvolucaoMes[] = [];
      // Count active processes created before our window
      let acumuladoBase = (allProcessos || []).filter(
        (p) => p.status !== "concluido" && p.status !== "arquivado"
      ).length;

      for (let i = 5; i >= 0; i--) {
        const mesDate = subMonths(hoje, i);
        const mesInicio = startOfMonth(mesDate);
        const mesFim = endOfMonth(mesDate);
        const label = format(mesDate, "MMM", { locale: ptBR });

        const abertos = (processos || []).filter((p) => {
          const d = new Date(p.created_at!);
          return d >= mesInicio && d <= mesFim;
        }).length;

        const concluidos = (processos || []).filter((p) => {
          if (p.status !== "concluido") return false;
          const d = p.data_ultima_atualizacao
            ? new Date(p.data_ultima_atualizacao)
            : null;
          if (!d) return false;
          return d >= mesInicio && d <= mesFim;
        }).length;

        acumuladoBase = acumuladoBase + abertos - concluidos;

        meses.push({
          mes: label.charAt(0).toUpperCase() + label.slice(1),
          abertos,
          concluidos,
          acumulado: Math.max(0, acumuladoBase),
        });
      }

      // Last 30 days vs previous 30 days
      const d30 = subDays(hoje, 30);
      const d60 = subDays(hoje, 60);

      const todos = [...(processos || []), ...(allProcessos || [])];
      const abertos30d = todos.filter(
        (p) => new Date(p.created_at!) >= d30
      ).length;
      const abertos60d = todos.filter(
        (p) => new Date(p.created_at!) >= d60 && new Date(p.created_at!) < d30
      ).length;

      const variacao =
        abertos60d > 0
          ? Math.round(((abertos30d - abertos60d) / abertos60d) * 100)
          : abertos30d > 0
          ? 100
          : 0;

      return { meses, abertos30d, variacao };
    },
  });
}
