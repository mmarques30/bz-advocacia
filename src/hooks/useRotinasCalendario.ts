import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface RotinaCalendario {
  id: string;
  titulo: string;
  data: string;
  horario: string | null;
  tipo: string;
  recorrente: boolean;
  recorrencia: string | null;
  prioridade: string;
  status: string;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
}

export function useRotinasCalendario() {
  return useQuery({
    queryKey: ["rotinas-calendario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rotinas_calendario")
        .select("*")
        .order("data", { ascending: true });

      if (error) throw error;
      return (data || []) as RotinaCalendario[];
    },
  });
}

export function useCreateRotina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rotina: Partial<RotinaCalendario>) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("rotinas_calendario")
        .insert({
          titulo: rotina.titulo,
          data: rotina.data,
          horario: rotina.horario || null,
          tipo: rotina.tipo || "outro",
          recorrente: rotina.recorrente || false,
          recorrencia: rotina.recorrencia || null,
          prioridade: rotina.prioridade || "media",
          status: "pendente",
          observacoes: rotina.observacoes || null,
          created_by: user?.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rotinas-calendario"] });
      toast({ title: "Rotina criada", description: "A rotina foi cadastrada com sucesso." });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar rotina", description: error.message, variant: "destructive" });
    },
  });
}

export function useToggleRotinaStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, concluido }: { id: string; concluido: boolean }) => {
      const { data, error } = await supabase
        .from("rotinas_calendario")
        .update({ status: concluido ? "concluido" : "pendente" } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rotinas-calendario"] });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar rotina", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteRotina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rotinas_calendario")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rotinas-calendario"] });
      toast({ title: "Rotina excluída", description: "A rotina foi removida." });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir rotina", description: error.message, variant: "destructive" });
    },
  });
}
