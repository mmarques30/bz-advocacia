import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClientes() {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .eq("estagio", "fechado")
        .order("nome_completo");

      if (error) throw error;
      return data || [];
    },
  });
}

export function useProcessosCliente(clienteId: string | null) {
  return useQuery({
    queryKey: ["processos-cliente", clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      if (!clienteId) return [];

      const { data, error } = await supabase
        .from("processos")
        .select("*")
        .eq("lead_id", clienteId)
        .order("data_inicio", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function usePagamentosCliente(
  clienteId: string | null,
  dataInicio?: Date,
  dataFim?: Date
) {
  return useQuery({
    queryKey: ["pagamentos-cliente", clienteId, dataInicio, dataFim],
    enabled: !!clienteId,
    queryFn: async () => {
      if (!clienteId) return [];

      // Buscar acordos do cliente
      const { data: acordos } = await supabase
        .from("acordos_financeiros")
        .select("id")
        .eq("cliente_id", clienteId);

      if (!acordos || acordos.length === 0) return [];

      const acordoIds = acordos.map((a) => a.id);

      // Buscar parcelas dos acordos
      const { data: parcelas } = await supabase
        .from("parcelas_financeiras")
        .select("id")
        .in("acordo_id", acordoIds);

      if (!parcelas || parcelas.length === 0) return [];

      const parcelaIds = parcelas.map((p) => p.id);

      // Buscar pagamentos
      let query = supabase
        .from("historico_pagamentos")
        .select(`
          *,
          parcela:parcelas_financeiras!parcela_id(
            numero_parcela,
            acordo:acordos_financeiros!acordo_id(tipo_servico)
          )
        `)
        .in("parcela_id", parcelaIds)
        .order("data_pagamento", { ascending: false });

      if (dataInicio) {
        query = query.gte("data_pagamento", dataInicio.toISOString());
      }
      if (dataFim) {
        query = query.lte("data_pagamento", dataFim.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
}

export function useVencimentosCliente(clienteId: string | null) {
  return useQuery({
    queryKey: ["vencimentos-cliente", clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      if (!clienteId) return [];

      // Buscar acordos do cliente
      const { data: acordos } = await supabase
        .from("acordos_financeiros")
        .select("id, tipo_servico")
        .eq("cliente_id", clienteId);

      if (!acordos || acordos.length === 0) return [];

      const acordoIds = acordos.map((a) => a.id);

      // Buscar parcelas pendentes
      const { data, error } = await supabase
        .from("parcelas_financeiras")
        .select(`
          *,
          acordo:acordos_financeiros!acordo_id(tipo_servico)
        `)
        .in("acordo_id", acordoIds)
        .eq("status", "pendente")
        .gte("data_vencimento", new Date().toISOString())
        .order("data_vencimento");

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAndamentosCliente(clienteId: string | null, limite = 10) {
  return useQuery({
    queryKey: ["andamentos-cliente", clienteId, limite],
    enabled: !!clienteId,
    queryFn: async () => {
      if (!clienteId) return [];

      // Buscar processos do cliente
      const { data: processos } = await supabase
        .from("processos")
        .select("id, numero_processo, tipo")
        .eq("lead_id", clienteId);

      if (!processos || processos.length === 0) return [];

      const processoIds = processos.map((p) => p.id);

      // Buscar andamentos
      const { data, error } = await supabase
        .from("processos_andamentos")
        .select(`
          *,
          processo:processos!processo_id(numero_processo, tipo)
        `)
        .in("processo_id", processoIds)
        .order("data_andamento", { ascending: false })
        .limit(limite);

      if (error) throw error;
      return data || [];
    },
  });
}

export function useDocumentosCliente(clienteId: string | null) {
  return useQuery({
    queryKey: ["documentos-cliente", clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      if (!clienteId) return [];

      // Buscar processos do cliente
      const { data: processos } = await supabase
        .from("processos")
        .select("id, numero_processo")
        .eq("lead_id", clienteId);

      if (!processos || processos.length === 0) return [];

      const processoIds = processos.map((p) => p.id);

      // Buscar documentos
      const { data, error } = await supabase
        .from("processos_documentos")
        .select(`
          *,
          processo:processos!processo_id(numero_processo)
        `)
        .in("processo_id", processoIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}
