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
      
      // Se não houver dados, retornar array vazio
      if (!data || data.length === 0) {
        return [] as MetaCampanha[];
      }
      
      return data as MetaCampanha[];
    },
  });

  return {
    campanhas: campanhas || [],
    isLoading,
  };
}
