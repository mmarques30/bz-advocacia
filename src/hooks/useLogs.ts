import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LogSistema, LogFilters, LogStats } from '@/types/logs';

export function useLogs(filters?: LogFilters, page = 1, pageSize = 50) {
  return useQuery({
    queryKey: ['logs', filters, page],
    queryFn: async () => {
      let query = supabase
        .from('logs_sistema')
        .select(`
          *,
          profiles:usuario_id (
            nome_completo,
            email,
            avatar_url
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (filters?.busca) {
        query = query.ilike('descricao', `%${filters.busca}%`);
      }

      if (filters?.usuario_id) {
        query = query.eq('usuario_id', filters.usuario_id);
      }

      if (filters?.acao && filters.acao.length > 0) {
        query = query.in('acao', filters.acao);
      }

      if (filters?.entidade_tipo && filters.entidade_tipo.length > 0) {
        query = query.in('entidade_tipo', filters.entidade_tipo);
      }

      if (filters?.data_inicio) {
        query = query.gte('created_at', filters.data_inicio);
      }

      if (filters?.data_fim) {
        query = query.lte('created_at', filters.data_fim);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const logs: LogSistema[] = (data || []).map((log: any) => ({
        ...log,
        usuario_nome: log.profiles?.nome_completo,
        usuario_email: log.profiles?.email,
        usuario_avatar: log.profiles?.avatar_url,
      }));

      return { logs, total: count || 0 };
    },
  });
}

export function useLogStats() {
  return useQuery({
    queryKey: ['log-stats'],
    queryFn: async () => {
      const [totalResult, hojResult, semanaResult, ativoResult] = await Promise.all([
        supabase.from('logs_sistema').select('*', { count: 'exact', head: true }),
        supabase
          .from('logs_sistema')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase
          .from('logs_sistema')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('logs_sistema')
          .select(`
            usuario_id,
            profiles:usuario_id (
              nome_completo
            )
          `)
          .not('usuario_id', 'is', null)
          .limit(1000),
      ]);

      // Calcular usuário mais ativo manualmente
      const usuarioMaisAtivo = ativoResult.data?.reduce((acc: any, log: any) => {
        const userId = log.usuario_id;
        if (!userId) return acc;
        
        if (!acc[userId]) {
          acc[userId] = {
            usuario_id: userId,
            usuario_nome: log.profiles?.nome_completo || 'Desconhecido',
            count: 0,
          };
        }
        acc[userId].count++;
        return acc;
      }, {} as Record<string, any>);

      const topUser = usuarioMaisAtivo 
        ? Object.values(usuarioMaisAtivo).sort((a: any, b: any) => b.count - a.count)[0] as any
        : undefined;

      const stats: LogStats = {
        total_logs: totalResult.count || 0,
        logs_hoje: hojResult.count || 0,
        logs_semana: semanaResult.count || 0,
        usuario_mais_ativo: topUser,
      };

      return stats;
    },
  });
}

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios-for-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome_completo, email')
        .order('nome_completo');

      if (error) throw error;
      return data || [];
    },
  });
}
