/**
 * Hooks relacionados a acordos financeiros (contratos + parcelas).
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/lib/toast";
import { format, subMonths, differenceInDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import type { FaturamentoFiltersState } from "@/components/financeiro/FaturamentoFilters";
import { getDateRangeFromFilters } from "./_shared";

import type { AcordoFinanceiro, AcordosFilters } from "@/types/financeiro";

export function useAcordos(filters?: AcordosFilters) {
  return useQuery({
    queryKey: ["acordos-financeiros", filters],
    queryFn: async (): Promise<AcordoFinanceiro[]> => {
      let query = supabase
        .from("acordos_financeiros")
        .select(`
          *,
          cliente:contact_submissions!cliente_id(id, nome_completo, email, telefone),
          processo:processos!processo_id(id, numero_processo, tipo),
          parcelas:parcelas_financeiras(*)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status.length > 0) {
        query = query.in("status", filters.status);
      }

      if (filters?.cliente_id) {
        query = query.eq("cliente_id", filters.cliente_id);
      }

      if (filters?.search) {
        // Busca será feita no cliente depois
      }

      const { data, error } = await query;
      if (error) throw error;

      let acordos = data as any[];

      if (filters?.possui_atraso) {
        acordos = acordos.filter(acordo => 
          acordo.parcelas?.some((p: any) => 
            p.status !== 'pago' && new Date(p.data_vencimento) < new Date()
          )
        );
      }

      return acordos.map(acordo => ({
        ...acordo,
        cliente: acordo.cliente ? acordo.cliente[0] : undefined,
        processo: acordo.processo ? acordo.processo[0] : undefined,
      }));
    },
  });
}

export function useAcordoDetalhes(acordoId: string | null) {
  return useQuery({
    queryKey: ["acordo-detalhes", acordoId],
    enabled: !!acordoId,
    queryFn: async (): Promise<AcordoFinanceiro | null> => {
      if (!acordoId) return null;

      const { data, error } = await supabase
        .from("acordos_financeiros")
        .select(`
          *,
          cliente:contact_submissions!cliente_id(id, nome_completo, email, telefone),
          processo:processos!processo_id(id, numero_processo, tipo),
          parcelas:parcelas_financeiras(*)
        `)
        .eq("id", acordoId)
        .single();

      if (error) throw error;

      return {
        ...data,
        cliente: data.cliente?.[0],
        processo: data.processo?.[0],
      } as AcordoFinanceiro;
    },
  });
}

export function useCreateAcordo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (acordo: any) => {
      const { parcelas, ...acordoData } = acordo;

      // Rodada 1: preferimos a RPC atomica (acordo + parcelas numa unica
      // transacao Postgres). Se estiver indisponivel, cai no fluxo de
      // 2 inserts separados mantendo o comportamento antigo.
      try {
        const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
          "create_acordo_atomico",
          {
            p_acordo: acordoData,
            p_parcelas: parcelas && parcelas.length > 0 ? parcelas : [],
          },
        );

        if (rpcError) throw rpcError;

        // A RPC retorna apenas o uuid; o hook que consome espera o row
        // completo. Buscamos o row recem-criado para manter contrato.
        const acordoId = rpcData as string;
        const { data: novo, error: fetchError } = await supabase
          .from("acordos_financeiros")
          .select("*")
          .eq("id", acordoId)
          .single();
        if (fetchError) throw fetchError;
        return novo;
      } catch (rpcErr) {
        console.warn(
          "RPC create_acordo_atomico indisponivel, usando fallback 2-step:",
          rpcErr,
        );
      }

      // Fallback legado (pre-Rodada 1). Mantido para ambientes sem a
      // RPC aplicada. Atomicidade nao garantida — se insert das parcelas
      // falhar, o acordo ja foi persistido.
      const { data: novoAcordo, error: acordoError } = await supabase
        .from("acordos_financeiros")
        .insert([acordoData])
        .select()
        .single();

      if (acordoError) throw acordoError;

      if (parcelas && parcelas.length > 0) {
        const parcelasComAcordo = parcelas.map(p => ({
          ...p,
          acordo_id: novoAcordo.id,
        }));

        const { error: parcelasError } = await supabase
          .from("parcelas_financeiras")
          .insert(parcelasComAcordo);

        if (parcelasError) throw parcelasError;
      }

      return novoAcordo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acordos-financeiros"] });
      queryClient.invalidateQueries({ queryKey: ["kpis-financeiros"] });
      queryClient.invalidateQueries({ queryKey: ["fluxo-caixa"] });
      queryClient.invalidateQueries({ queryKey: ["receita-mensal"] });
      queryClient.invalidateQueries({ queryKey: ["projetado-vs-realizado"] });
      toast({
        title: "Acordo criado",
        description: "O acordo financeiro foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar acordo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

