import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetaCampanha } from "@/types/meta-ads";

export function useMetaCampaigns() {
  const { data: campanhas, isLoading } = useQuery({
    queryKey: ["meta-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meta_campanhas")
        .select("*")
        .order("gasto", { ascending: false });

      if (error) throw error;
      
      // Se não houver dados, retornar dados de demonstração
      if (!data || data.length === 0) {
        return [
          {
            id: "demo-1",
            connection_id: "demo",
            campaign_id: "123456789",
            nome: "Divórcio São Paulo",
            status: "ACTIVE",
            objetivo: "LEAD_GENERATION",
            gasto: 1200.00,
            impressoes: 45000,
            cliques: 1260,
            leads: 45,
            custo_lead: 26.67,
            ctr: 2.8,
            atualizado_em: new Date().toISOString(),
          },
          {
            id: "demo-2",
            connection_id: "demo",
            campaign_id: "987654321",
            nome: "Pensão Alimentos",
            status: "ACTIVE",
            objetivo: "LEAD_GENERATION",
            gasto: 890.00,
            impressoes: 38000,
            cliques: 1178,
            leads: 38,
            custo_lead: 23.42,
            ctr: 3.1,
            atualizado_em: new Date().toISOString(),
          },
          {
            id: "demo-3",
            connection_id: "demo",
            campaign_id: "555444333",
            nome: "Guarda Filhos",
            status: "ACTIVE",
            objetivo: "LEAD_GENERATION",
            gasto: 1300.00,
            impressoes: 54000,
            cliques: 1296,
            leads: 44,
            custo_lead: 29.55,
            ctr: 2.4,
            atualizado_em: new Date().toISOString(),
          },
        ] as MetaCampanha[];
      }
      
      return data as MetaCampanha[];
    },
  });

  return {
    campanhas: campanhas || [],
    isLoading,
  };
}
