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
