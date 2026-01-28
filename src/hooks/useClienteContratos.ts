import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContratoCliente {
  id: string;
  cliente_id: string;
  template_id?: string;
  titulo: string;
  tipo_contrato: string;
  conteudo_final: string;
  pdf_url?: string;
  status: string;
  valores: {
    valor_entrada?: number;
    valor_parcelas?: number;
    num_parcelas?: number;
    percentual_exito?: number;
    valor_total?: number;
    desconto_avista?: number;
  } | null;
  dados_contrato: {
    objeto?: string;
    cidade?: string;
    data_contrato?: string;
    observacoes?: string;
    condicoes_adicionais?: string;
  } | null;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export function useClienteContratos(clienteId: string) {
  return useQuery({
    queryKey: ['cliente-contratos', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos_gerados')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContratoCliente[];
    },
    enabled: !!clienteId,
  });
}
