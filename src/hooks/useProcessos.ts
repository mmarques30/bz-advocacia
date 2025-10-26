import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Processo, ProcessosFilters } from "@/types/processos";
import { toast } from "@/hooks/use-toast";

export function useProcessos(filters: ProcessosFilters) {
  return useQuery({
    queryKey: ["processos", filters],
    queryFn: async () => {
      let query = supabase
        .from("processos")
        .select(`
          *,
          cliente:contact_submissions!processos_lead_id_fkey(
            id,
            nome_completo,
            email,
            telefone
          )
        `)
        .order("data_ultima_atualizacao", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      // Filtro por status
      if (filters.status.length > 0) {
        query = query.in("status", filters.status);
      }

      // Filtro por busca (número, tipo)
      if (filters.search) {
        query = query.or(
          `numero_processo.ilike.%${filters.search}%,tipo.ilike.%${filters.search}%`
        );
      }

      // Filtro por tribunal
      if (filters.tribunal) {
        query = query.eq("tribunal", filters.tribunal);
      }

      // Filtro por tipo
      if (filters.tipo) {
        query = query.ilike("tipo", `%${filters.tipo}%`);
      }

      // Filtro por responsável
      if (filters.responsavel_id) {
        query = query.eq("responsavel_id", filters.responsavel_id);
      }

      // Filtro por prazo próximo (< 7 dias)
      if (filters.tem_prazo_proximo) {
        const seteDiasFrente = new Date();
        seteDiasFrente.setDate(seteDiasFrente.getDate() + 7);
        query = query
          .not("prazo_proximo", "is", null)
          .lte("prazo_proximo", seteDiasFrente.toISOString().split("T")[0])
          .gte("prazo_proximo", new Date().toISOString().split("T")[0]);
      }

      // Filtro por sem atualização há X dias
      if (filters.sem_atualizacao_dias) {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - filters.sem_atualizacao_dias);
        query = query.or(
          `data_ultima_atualizacao.lt.${dataLimite.toISOString().split("T")[0]},data_ultima_atualizacao.is.null`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as Processo[];
    },
  });
}

export function useCreateProcesso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (processoData: Partial<Processo>) => {
      const { data, error } = await supabase
        .from("processos")
        .insert({
          ...processoData,
          status: processoData.status || "em_andamento",
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      toast({
        title: "Processo criado",
        description: "O processo foi cadastrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar processo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProcesso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Processo> & { id: string }) => {
      const { data, error } = await supabase
        .from("processos")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      toast({
        title: "Processo atualizado",
        description: "As informações do processo foram atualizadas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
