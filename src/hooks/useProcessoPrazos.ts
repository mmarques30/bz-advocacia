import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProcessoPrazo } from "@/types/processos";
import { toast } from "@/lib/toast";

export function useProcessoPrazos(processoId?: string) {
  return useQuery({
    queryKey: ["processo-prazos", processoId],
    queryFn: async () => {
      let query = supabase
        .from("processos_prazos")
        .select(`
          *,
          processo:processos(
            id,
            numero_processo,
            tipo,
            tribunal,
            status,
            autor,
            reu
          )
        `)
        .order("data_prazo", { ascending: true });

      if (processoId) {
        query = query.eq("processo_id", processoId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calcular dias restantes e alerta ativo
      const prazosComCalculo = (data || []).map((prazo) => {
        const dataPrazo = new Date(prazo.data_prazo);
        const hoje = new Date();
        const diasRestantes = Math.ceil(
          (dataPrazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        );
        const alertaAtivo = 
          prazo.status === 'pendente' && 
          diasRestantes >= 0 && 
          diasRestantes <= (prazo.alerta_dias_antes || 7);

        return {
          ...prazo,
          dias_restantes: diasRestantes,
          alerta_ativo: alertaAtivo,
        } as ProcessoPrazo;
      });

      return prazosComCalculo;
    },
  });
}

export function useCreatePrazo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prazo: Partial<ProcessoPrazo>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("processos_prazos")
        .insert({
          ...prazo,
          created_by: user?.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-prazos"] });
      toast({
        title: "Prazo criado",
        description: "O prazo foi cadastrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar prazo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdatePrazo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProcessoPrazo> & { id: string }) => {
      const { data, error } = await supabase
        .from("processos_prazos")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-prazos"] });
      toast({
        title: "Prazo atualizado",
        description: "O prazo foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar prazo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeletePrazo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prazoId: string) => {
      const { error } = await supabase
        .from("processos_prazos")
        .delete()
        .eq("id", prazoId);

      if (error) throw error;
      return prazoId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-prazos"] });
      toast({
        title: "Prazo excluído",
        description: "O prazo foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir prazo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useTogglePrazoCumprido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cumprido }: { id: string; cumprido: boolean }) => {
      const { data, error } = await supabase
        .from("processos_prazos")
        .update({ status: cumprido ? 'cumprido' : 'pendente' } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-prazos"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
