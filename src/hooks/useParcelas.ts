import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
      // Atualizar parcela
      const { error: parcelaError } = await supabase
        .from("parcelas_financeiras")
        .update({
          status: "pago",
          data_pagamento: dataPagamento,
          valor_pago: valorPago,
          forma_pagamento_recebido: formaPagamento,
          observacoes,
        })
        .eq("id", parcelaId);

      if (parcelaError) throw parcelaError;

      // Registrar no histórico
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

      return { parcelaId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcelas"] });
      queryClient.invalidateQueries({ queryKey: ["acordo-detalhes"] });
      queryClient.invalidateQueries({ queryKey: ["acordos-financeiros"] });
      queryClient.invalidateQueries({ queryKey: ["kpis-financeiros"] });
      queryClient.invalidateQueries({ queryKey: ["parcelas-vencendo"] });
      queryClient.invalidateQueries({ queryKey: ["historico-pagamentos"] });
      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi registrado com sucesso.",
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
