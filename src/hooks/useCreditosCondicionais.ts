import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import type { StatusCreditoCondicional } from "@/types/financeiro";

interface CreditoFilters {
  status?: StatusCreditoCondicional;
}

export function useCreditosCondicionais(filters?: CreditoFilters) {
  return useQuery({
    queryKey: ["creditos_condicionais", filters],
    queryFn: async () => {
      let query = supabase
        .from("creditos_condicionais")
        .select("*, cliente:contact_submissions!cliente_id(id, nome_completo), processo:processos!processo_id(id, numero_processo, tipo)")
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCreditoCondicional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      cliente_id: string;
      processo_id?: string | null;
      descricao: string;
      valor: number;
      conta?: string;
      evento_gatilho: string;
      observacoes?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("creditos_condicionais").insert({
        ...data,
        status: "backlog",
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creditos_condicionais"] });
      toast({ title: "Crédito condicional criado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao criar crédito condicional", variant: "destructive" });
    },
  });
}

export function useAtivarCredito() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data_ativacao }: { id: string; data_ativacao: string }) => {
      const { error } = await supabase
        .from("creditos_condicionais")
        .update({ status: "a_receber", data_ativacao })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creditos_condicionais"] });
      toast({ title: "Crédito ativado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao ativar crédito", variant: "destructive" });
    },
  });
}

export function useConverterCredito() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (credito: {
      id: string;
      cliente_id: string;
      processo_id: string | null;
      descricao: string;
      valor: number;
      data_ativacao: string | null;
      conta: string | null;
    }) => {
      const dataVencimento = credito.data_ativacao || new Date().toISOString().split("T")[0];

      const { data: acordo, error: acordoErr } = await supabase
        .from("acordos_financeiros")
        .insert({
          cliente_id: credito.cliente_id,
          processo_id: credito.processo_id,
          tipo_servico: credito.descricao,
          valor_total: credito.valor,
          forma_pagamento: "a_vista",
          numero_parcelas: 1,
          data_primeiro_vencimento: dataVencimento,
          conta: credito.conta,
        })
        .select()
        .single();
      if (acordoErr) throw acordoErr;

      const { error: parcelaErr } = await supabase.from("parcelas_financeiras").insert({
        acordo_id: acordo.id,
        numero_parcela: 1,
        valor: credito.valor,
        data_vencimento: dataVencimento,
        status: "pendente",
      });
      if (parcelaErr) throw parcelaErr;

      const { error: updateErr } = await supabase
        .from("creditos_condicionais")
        .update({ status: "convertido", acordo_id: acordo.id })
        .eq("id", credito.id);
      if (updateErr) throw updateErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creditos_condicionais"] });
      qc.invalidateQueries({ queryKey: ["acordos"] });
      qc.invalidateQueries({ queryKey: ["parcelas"] });
      toast({ title: "Crédito convertido em acordo financeiro" });
    },
    onError: () => {
      toast({ title: "Erro ao converter crédito", variant: "destructive" });
    },
  });
}

export function useCancelarCredito() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("creditos_condicionais")
        .update({ status: "cancelado" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creditos_condicionais"] });
      toast({ title: "Crédito cancelado" });
    },
    onError: () => {
      toast({ title: "Erro ao cancelar crédito", variant: "destructive" });
    },
  });
}
