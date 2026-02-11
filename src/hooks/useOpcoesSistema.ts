import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OpcaoSistema {
  id: string;
  grupo: string;
  valor: string;
  label: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

type GrupoOpcao = 'origem_lead' | 'tipo_processo' | 'categoria_despesa' | 'categoria_tarefa';

export function useOpcoesSistema(grupo: GrupoOpcao, apenasAtivos = false) {
  return useQuery({
    queryKey: ['opcoes_sistema', grupo, apenasAtivos],
    queryFn: async () => {
      let query = supabase
        .from('opcoes_sistema')
        .select('*')
        .eq('grupo', grupo)
        .order('ordem', { ascending: true });

      if (apenasAtivos) {
        query = query.eq('ativo', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as OpcaoSistema[];
    },
  });
}

export function useCreateOpcao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opcao: { grupo: string; valor: string; label: string; ordem: number }) => {
      const { data, error } = await supabase
        .from('opcoes_sistema')
        .insert(opcao)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['opcoes_sistema', data.grupo] });
      toast.success('Opção criada com sucesso');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Já existe uma opção com este código');
      } else {
        toast.error('Erro ao criar opção');
      }
    },
  });
}

export function useUpdateOpcao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; label?: string; ativo?: boolean; ordem?: number }) => {
      const { data, error } = await supabase
        .from('opcoes_sistema')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['opcoes_sistema', data.grupo] });
      toast.success('Opção atualizada');
    },
    onError: () => {
      toast.error('Erro ao atualizar opção');
    },
  });
}

export function useDeleteOpcao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, grupo }: { id: string; grupo: string }) => {
      const { error } = await supabase
        .from('opcoes_sistema')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { grupo };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['opcoes_sistema', data.grupo] });
      toast.success('Opção removida');
    },
    onError: () => {
      toast.error('Erro ao remover opção');
    },
  });
}

export function useReorderOpcoes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ opcoes, grupo }: { opcoes: { id: string; ordem: number }[]; grupo: string }) => {
      for (const opcao of opcoes) {
        const { error } = await supabase
          .from('opcoes_sistema')
          .update({ ordem: opcao.ordem })
          .eq('id', opcao.id);
        if (error) throw error;
      }
      return { grupo };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['opcoes_sistema', data.grupo] });
    },
  });
}
