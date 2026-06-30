import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import { Demanda } from "@/types/demandas";
import { invalidateTarefasQueries } from "@/hooks/useDemandas";

export const useSubtarefas = (parentId: string | null) => {
  return useQuery({
    queryKey: ['subtarefas', parentId],
    queryFn: async () => {
      if (!parentId) return [];
      const { data, error } = await supabase
        .from('demandas_internas')
        .select(`
          *,
          criador:profiles!demandas_internas_criado_por_fkey(nome_completo),
          responsavel:profiles!demandas_internas_responsavel_id_fkey(nome_completo),
          processo:processos(numero_processo, tipo),
          lead:contact_submissions(nome_completo)
        `)
        .eq('parent_id', parentId)
        .order('ordem', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Demanda[];
    },
    enabled: !!parentId,
  });
};

export const useCreateSubtarefa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subtarefa: {
      titulo: string;
      parent_id: string;
      ordem: number;
      advogada_responsavel: string;
      responsavel_id?: string | null;
      data_limite?: string | null;
      processo_id?: string | null;
      lead_id?: string | null;
      categoria?: string;
      tipo?: string;
      prioridade?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('demandas_internas')
        .insert([{
          titulo: subtarefa.titulo,
          parent_id: subtarefa.parent_id,
          ordem: subtarefa.ordem,
          advogada_responsavel: subtarefa.advogada_responsavel,
          responsavel_id: subtarefa.responsavel_id || null,
          data_limite: subtarefa.data_limite || null,
          processo_id: subtarefa.processo_id || null,
          lead_id: subtarefa.lead_id || null,
          categoria: subtarefa.categoria || 'geral',
          tipo: subtarefa.tipo || 'tarefa',
          prioridade: subtarefa.prioridade || 'media',
          status: 'pendente',
          criado_por: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      invalidateTarefasQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ['subtarefas', variables.parent_id] });
      toast.success('Subtarefa criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar subtarefa:', error);
      toast.error('Erro ao criar subtarefa: ' + (error?.message || 'Erro desconhecido'));
    },
  });
};

export const useUpdateSubtarefaStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, parentId }: { id: string; status: string; parentId: string }) => {
      const { data, error } = await supabase
        .from('demandas_internas')
        .update({
          status,
          data_conclusao: status === 'concluido' ? new Date().toISOString().split('T')[0] : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      invalidateTarefasQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ['subtarefas', variables.parentId] });
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar subtarefa: ' + error.message);
    },
  });
};
