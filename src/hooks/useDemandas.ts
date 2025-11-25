import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Demanda {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: 'melhoria' | 'bug' | 'sugestao' | 'tarefa';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  criado_por: string | null;
  responsavel_id: string | null;
  data_conclusao: string | null;
  created_at: string;
  updated_at: string;
  criador?: { nome_completo: string };
  responsavel?: { nome_completo: string };
}

interface DemandasFilters {
  tipo?: string;
  status?: string;
  prioridade?: string;
  search?: string;
}

export const useDemandas = (filters?: DemandasFilters) => {
  return useQuery({
    queryKey: ['demandas', filters],
    queryFn: async () => {
      let query = supabase
        .from('demandas_internas')
        .select(`
          *,
          criador:profiles!demandas_internas_criado_por_fkey(nome_completo),
          responsavel:profiles!demandas_internas_responsavel_id_fkey(nome_completo)
        `)
        .order('created_at', { ascending: false });

      if (filters?.tipo) {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.prioridade) {
        query = query.eq('prioridade', filters.prioridade);
      }
      if (filters?.search) {
        query = query.ilike('titulo', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Demanda[];
    },
  });
};

export const useCreateDemanda = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (demanda: Omit<Demanda, 'id' | 'created_at' | 'updated_at' | 'criador' | 'responsavel'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('demandas_internas')
        .insert([{ ...demanda, criado_por: user?.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandas'] });
      toast.success('Demanda criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar demanda: ' + error.message);
    },
  });
};

export const useUpdateDemanda = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Demanda> & { id: string }) => {
      const { data, error } = await supabase
        .from('demandas_internas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandas'] });
      toast.success('Demanda atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar demanda: ' + error.message);
    },
  });
};

export const useDeleteDemanda = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('demandas_internas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandas'] });
      toast.success('Demanda excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir demanda: ' + error.message);
    },
  });
};