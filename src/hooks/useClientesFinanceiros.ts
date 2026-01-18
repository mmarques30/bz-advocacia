import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClientesReceitas() {
  return useQuery({
    queryKey: ["clientes-receitas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select("descricao")
        .eq("tipo_codigo", "receita")
        .not("descricao", "is", null)
        .order("descricao");

      if (error) throw error;

      // Retorna lista única de clientes/descrições
      const uniqueClientes = [...new Set(data?.map((t) => t.descricao).filter(Boolean))] as string[];
      return uniqueClientes;
    },
  });
}
