import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tag, TagFilters, TagFormData, TagWithStats, TagTipo } from "@/types/tags";

export function useTags(filters?: TagFilters) {
  return useQuery({
    queryKey: ['tags', filters],
    queryFn: async () => {
      let query = supabase
        .from('tags')
        .select(`
          *,
          entidade_tags (count)
        `)
        .order('created_at', { ascending: false });

      if (filters?.busca) {
        query = query.or(`nome.ilike.%${filters.busca}%,descricao.ilike.%${filters.busca}%`);
      }

      if (filters?.tipo) {
        query = query.eq('tipo', filters.tipo);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include uso_count
      const tagsWithStats: TagWithStats[] = (data || []).map(tag => ({
        id: tag.id,
        nome: tag.nome,
        tipo: tag.tipo as TagTipo,
        cor: tag.cor,
        descricao: tag.descricao || undefined,
        created_by: tag.created_by || undefined,
        created_at: tag.created_at,
        uso_count: tag.entidade_tags?.[0]?.count || 0,
      }));

      // Apply sorting
      if (filters?.ordenacao) {
        switch (filters.ordenacao) {
          case 'antigo':
            tagsWithStats.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            break;
          case 'az':
            tagsWithStats.sort((a, b) => a.nome.localeCompare(b.nome));
            break;
          case 'za':
            tagsWithStats.sort((a, b) => b.nome.localeCompare(a.nome));
            break;
          case 'mais-usado':
            tagsWithStats.sort((a, b) => b.uso_count - a.uso_count);
            break;
          default:
            // 'recente' is already the default order
            break;
        }
      }

      return tagsWithStats;
    },
  });
}

export function useTag(id: string) {
  return useQuery({
    queryKey: ['tag', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Tag;
    },
    enabled: !!id,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { nome: string; tipo: TagTipo; cor: string; descricao?: string }) => {
      const { data: result, error } = await supabase
        .from('tags')
        .insert([{
          nome: data.nome,
          tipo: data.tipo,
          cor: data.cor,
          descricao: data.descricao,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tag-stats'] });
      toast.success('Tag criada com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar tag');
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TagFormData> }) => {
      const { data: result, error } = await supabase
        .from('tags')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tag'] });
      toast.success('Tag atualizada com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar tag');
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tag-stats'] });
      toast.success('Tag deletada com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao deletar tag');
    },
  });
}

export function useTagStats() {
  return useQuery({
    queryKey: ['tag-stats'],
    queryFn: async () => {
      // Total de tags
      const { count: totalTags } = await supabase
        .from('tags')
        .select('*', { count: 'exact', head: true });

      // Tag mais usada
      const { data: tagsWithUsage } = await supabase
        .from('tags')
        .select(`
          id,
          nome,
          entidade_tags (count)
        `);

      const tagMaisUsada = tagsWithUsage
        ?.map(tag => ({
          nome: tag.nome,
          count: tag.entidade_tags?.[0]?.count || 0,
        }))
        .sort((a, b) => b.count - a.count)[0];

      // Tags criadas hoje
      const today = new Date().toISOString().split('T')[0];
      const { count: criadasHoje } = await supabase
        .from('tags')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      return {
        totalTags: totalTags || 0,
        tagMaisUsada: tagMaisUsada || { nome: '-', count: 0 },
        criadasHoje: criadasHoje || 0,
      };
    },
  });
}
