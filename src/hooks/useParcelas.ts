import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/lib/toast";
import type { ParcelaFinanceira } from "@/types/financeiro";

export function useParcelas(acordoId: string | null) {
  return useQuery({
    queryKey: ["parcelas", acordoId],
    enabled: !!acordoId,
    queryFn: async (): Promise<ParcelaFinanceira[]> => {
      if (!acordoId) return [];

      const { data, error } = await supabase
        .from("parcelas_financeiras")
        .select("*")
        .eq("acordo_id", acordoId)
        .order("numero_parcela", { ascending: true });

      if (error) throw error;
      return (data || []) as ParcelaFinanceira[];
    },
  });
}

export function useRegistrarPagamento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      parcelaId,
      dataPagamento,
      valorPago,
      formaPagamento,
      observacoes,
    }: {
      parcelaId: string;
      dataPagamento: string;
      valorPago: number;
      formaPagamento: string;
      observacoes?: string;
    }) => {
      // Lê o estado atual para acumular pagamentos parciais. O valor
      // informado aqui é o recebido NESTE evento; somamos ao que já foi
      // pago antes. A parcela só vira "pago" quando o acumulado cobre o
      // valor esperado — pagamento parcial mantém a parcela pendente com
      // o saldo restante em aberto.
      const { data: atual, error: fetchError } = await supabase
        .from("parcelas_financeiras")
        .select("valor, valor_pago")
        .eq("id", parcelaId)
        .single();

      if (fetchError) throw fetchError;

      const valorEsperado = Number(atual?.valor ?? 0);
      const jaPago = Number(atual?.valor_pago ?? 0);
      const acumulado = jaPago + valorPago;
      const quitado = acumulado >= valorEsperado - 0.005; // tolerância de centavos

      const { error: parcelaError } = await supabase
        .from("parcelas_financeiras")
        .update({
          status: quitado ? "pago" : "pendente",
          data_pagamento: quitado ? dataPagamento : null,
          valor_pago: acumulado,
          forma_pagamento_recebido: formaPagamento,
          observacoes,
        })
        .eq("id", parcelaId);

      if (parcelaError) throw parcelaError;

      // Registrar no histórico (cada recebimento é uma linha)
      const { error: historicoError } = await supabase
        .from("historico_pagamentos")
        .insert({
          parcela_id: parcelaId,
          valor: valorPago,
          data_pagamento: dataPagamento,
          forma_pagamento: formaPagamento,
          observacoes,
        });

      if (historicoError) throw historicoError;

      return { parcelaId, quitado };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["parcelas"] });
      queryClient.invalidateQueries({ queryKey: ["acordo-detalhes"] });
      queryClient.invalidateQueries({ queryKey: ["acordos-financeiros"] });
      queryClient.invalidateQueries({ queryKey: ["kpis-financeiros"] });
      queryClient.invalidateQueries({ queryKey: ["parcelas-vencendo"] });
      queryClient.invalidateQueries({ queryKey: ["historico-pagamentos"] });
      queryClient.invalidateQueries({ queryKey: ["total-parcelas-pendentes"] });
      toast({
        title: result.quitado ? "Pagamento registrado" : "Pagamento parcial registrado",
        description: result.quitado
          ? "A parcela foi quitada."
          : "O valor foi registrado e o saldo restante segue em aberto.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAddParcela() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      acordoId,
      valor,
      dataVencimento,
      observacoes,
    }: {
      acordoId: string;
      valor: number;
      dataVencimento: string;
      observacoes?: string;
    }) => {
      // Próximo número de parcela = maior existente + 1.
      const { data: ultima, error: ultimaError } = await supabase
        .from("parcelas_financeiras")
        .select("numero_parcela")
        .eq("acordo_id", acordoId)
        .order("numero_parcela", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ultimaError) throw ultimaError;

      const proximoNumero = (ultima?.numero_parcela ?? 0) + 1;

      const { error: parcelaError } = await supabase
        .from("parcelas_financeiras")
        .insert({
          acordo_id: acordoId,
          numero_parcela: proximoNumero,
          valor,
          data_vencimento: dataVencimento,
          status: "pendente",
          observacoes: observacoes || null,
        });

      if (parcelaError) throw parcelaError;

      // Mantém o cabeçalho do contrato consistente: a nova parcela soma ao
      // valor total e ao número de parcelas do acordo.
      const { data: acordo, error: acordoFetchError } = await supabase
        .from("acordos_financeiros")
        .select("valor_total, numero_parcelas")
        .eq("id", acordoId)
        .single();

      if (acordoFetchError) throw acordoFetchError;

      const { error: acordoUpdateError } = await supabase
        .from("acordos_financeiros")
        .update({
          valor_total: Number(acordo?.valor_total ?? 0) + valor,
          numero_parcelas: Number(acordo?.numero_parcelas ?? 0) + 1,
        })
        .eq("id", acordoId);

      if (acordoUpdateError) throw acordoUpdateError;

      return { acordoId, numero_parcela: proximoNumero };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcelas"] });
      queryClient.invalidateQueries({ queryKey: ["acordo-detalhes"] });
      queryClient.invalidateQueries({ queryKey: ["acordos-financeiros"] });
      queryClient.invalidateQueries({ queryKey: ["kpis-financeiros"] });
      queryClient.invalidateQueries({ queryKey: ["parcelas-vencendo"] });
      queryClient.invalidateQueries({ queryKey: ["total-parcelas-pendentes"] });
      queryClient.invalidateQueries({ queryKey: ["projetado-vs-realizado"] });
      toast({
        title: "Parcela adicionada",
        description: "A nova parcela foi incluída no contrato.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar parcela",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateParcela() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      parcelaId,
      data,
    }: {
      parcelaId: string;
      data: Partial<ParcelaFinanceira>;
    }) => {
      const { error } = await supabase
        .from("parcelas_financeiras")
        .update(data)
        .eq("id", parcelaId);

      if (error) throw error;
      return { parcelaId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcelas"] });
      queryClient.invalidateQueries({ queryKey: ["acordo-detalhes"] });
      toast({
        title: "Parcela atualizada",
        description: "A parcela foi atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar parcela",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDesfazerPagamento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (parcelaId: string) => {
      // Revert parcela to pendente
      const { error: parcelaError } = await supabase
        .from("parcelas_financeiras")
        .update({
          status: "pendente",
          data_pagamento: null,
          valor_pago: null,
          forma_pagamento_recebido: null,
        })
        .eq("id", parcelaId);

      if (parcelaError) throw parcelaError;

      // Remove payment history entries
      const { error: historicoError } = await supabase
        .from("historico_pagamentos")
        .delete()
        .eq("parcela_id", parcelaId);

      if (historicoError) throw historicoError;

      return parcelaId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcelas"] });
      queryClient.invalidateQueries({ queryKey: ["acordo-detalhes"] });
      queryClient.invalidateQueries({ queryKey: ["acordos-financeiros"] });
      queryClient.invalidateQueries({ queryKey: ["kpis-financeiros"] });
      queryClient.invalidateQueries({ queryKey: ["parcelas-vencendo"] });
      queryClient.invalidateQueries({ queryKey: ["historico-pagamentos"] });
      queryClient.invalidateQueries({ queryKey: ["projetado-vs-realizado"] });
      toast({
        title: "Pagamento desfeito",
        description: "A parcela voltou para o status pendente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao desfazer pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteParcela() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (parcelaId: string) => {
      const { error } = await supabase
        .from("parcelas_financeiras")
        .delete()
        .eq("id", parcelaId);

      if (error) throw error;
      return parcelaId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcelas"] });
      queryClient.invalidateQueries({ queryKey: ["acordo-detalhes"] });
      toast({
        title: "Parcela excluída",
        description: "A parcela foi removida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir parcela",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}