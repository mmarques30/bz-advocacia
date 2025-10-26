import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProcessoAndamento } from "@/types/processos";
import { toast } from "@/hooks/use-toast";

export function useProcessoAndamentos(processoId: string) {
  return useQuery({
    queryKey: ["processo-andamentos", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processos_andamentos")
        .select("*")
        .eq("processo_id", processoId)
        .order("data_andamento", { ascending: false });

      if (error) throw error;
      return data as ProcessoAndamento[];
    },
  });
}

export function useCreateAndamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (andamento: Partial<ProcessoAndamento>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("processos_andamentos")
        .insert({
          ...andamento,
          created_by: user?.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-andamentos"] });
      toast({
        title: "Andamento registrado",
        description: "O andamento foi registrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar andamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateAndamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProcessoAndamento> & { id: string }) => {
      const { data, error } = await supabase
        .from("processos_andamentos")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-andamentos"] });
      toast({
        title: "Andamento atualizado",
        description: "O andamento foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar andamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteAndamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (andamentoId: string) => {
      const { error } = await supabase
        .from("processos_andamentos")
        .delete()
        .eq("id", andamentoId);

      if (error) throw error;
      return andamentoId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-andamentos"] });
      toast({
        title: "Andamento excluído",
        description: "O andamento foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir andamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
