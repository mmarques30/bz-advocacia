import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Demanda, DemandasFilters } from "@/types/demandas";

export const useDemandas = (filters?: DemandasFilters) => {
  return useQuery({
    queryKey: ['demandas', filters],
    queryFn: async () => {
      let query = supabase
        .from('demandas_internas')
        .select(`
          *,
          criador:profiles!demandas_internas_criado_por_fkey(nome_completo),
          responsavel:profiles!demandas_internas_responsavel_id_fkey(nome_completo),
          processo:processos(numero_processo, tipo),
          lead:contact_submissions(nome_completo)
        `)
        .is('parent_id', null)
        .order('created_at', { ascending: filters?.ordenacao === 'antigo' });

      if (filters?.tipo) {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.prioridade) {
        query = query.eq('prioridade', filters.prioridade);
      }
      if (filters?.categoria) {
        query = query.eq('categoria', filters.categoria);
      }
      if (filters?.search) {
        query = query.ilike('titulo', `%${filters.search}%`);
      }
      if (filters?.advogada_responsavel) {
        query = query.eq('advogada_responsavel', filters.advogada_responsavel);
      }

      // Quando nenhum status é selecionado, excluir concluídas e canceladas por padrão
      if (!filters?.status) {
        query = query.not('status', 'in', '("concluido","cancelado")');
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Demanda[];
    },
  });
};

export const useDemandasStats = () => {
  return useQuery({
    queryKey: ['demandas-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Total de demandas ativas
      const { count: total } = await supabase
        .from('demandas_internas')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("concluido","cancelado")');

      // Demandas atrasadas (data_limite passada e não concluída)
      const { count: atrasadas } = await supabase
        .from('demandas_internas')
        .select('*', { count: 'exact', head: true })
        .lt('data_limite', today)
        .not('status', 'in', '("concluido","cancelado")');

      // Demandas urgentes pendentes
      const { count: urgentes } = await supabase
        .from('demandas_internas')
        .select('*', { count: 'exact', head: true })
        .eq('prioridade', 'urgente')
        .not('status', 'in', '("concluido","cancelado")');

      // Categoria com mais demandas
      const { data: categoriaData } = await supabase
        .from('demandas_internas')
        .select('categoria')
        .not('status', 'in', '("concluido","cancelado")');

      const categoriaCounts: Record<string, number> = {};
      categoriaData?.forEach((d) => {
        const cat = d.categoria || 'geral';
        categoriaCounts[cat] = (categoriaCounts[cat] || 0) + 1;
      });

      const topCategoria = Object.entries(categoriaCounts).sort((a, b) => b[1] - a[1])[0];

      return {
        total: total || 0,
        atrasadas: atrasadas || 0,
        urgentes: urgentes || 0,
        topCategoria: topCategoria ? { nome: topCategoria[0], count: topCategoria[1] } : null,
      };
    },
  });
};

export const useDemandasByStatus = () => {
  return useQuery({
    queryKey: ['demandas-by-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demandas_internas')
        .select(`
          *,
          criador:profiles!demandas_internas_criado_por_fkey(nome_completo),
          responsavel:profiles!demandas_internas_responsavel_id_fkey(nome_completo),
          processo:processos(numero_processo, tipo),
          lead:contact_submissions(nome_completo)
        `)
        .is('parent_id', null)
        .not('status', 'eq', 'cancelado')
        .order('prioridade', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const grouped: Record<string, Demanda[]> = {};

      (data as Demanda[])?.forEach((demanda) => {
        const status = demanda.status || 'pendente';
        if (!grouped[status]) grouped[status] = [];
        grouped[status].push(demanda);
      });

      return grouped;
    },
  });
};

export const useCreateDemanda = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (demanda: {
      titulo: string;
      tipo: string;
      descricao?: string | null;
      prioridade?: string;
      status?: string;
      responsavel_id?: string | null;
      categoria?: string;
      advogada_responsavel?: string;
      processo_id?: string | null;
      lead_id?: string | null;
      data_limite?: string | null;
      data_conclusao?: string | null;
      parent_id?: string | null;
      ordem?: number | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('demandas_internas')
        .insert([{ 
          ...demanda, 
          criado_por: user?.id,
          categoria: demanda.categoria || 'geral',
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandas'] });
      queryClient.invalidateQueries({ queryKey: ['demandas-stats'] });
      queryClient.invalidateQueries({ queryKey: ['demandas-by-status'] });
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
      queryClient.invalidateQueries({ queryKey: ['demandas-stats'] });
      queryClient.invalidateQueries({ queryKey: ['demandas-by-status'] });
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
      queryClient.invalidateQueries({ queryKey: ['demandas-stats'] });
      queryClient.invalidateQueries({ queryKey: ['demandas-by-status'] });
      toast.success('Demanda excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir demanda: ' + error.message);
    },
  });
};

export const useDemandasByLead = (leadId: string) => {
  return useQuery({
    queryKey: ['demandas-by-lead', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demandas_internas')
        .select(`
          *,
          criador:profiles!demandas_internas_criado_por_fkey(nome_completo),
          responsavel:profiles!demandas_internas_responsavel_id_fkey(nome_completo),
          processo:processos(numero_processo, tipo)
        `)
        .eq('lead_id', leadId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Demanda[];
    },
    enabled: !!leadId,
  });
};
