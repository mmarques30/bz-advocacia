import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LogSistema, LogFilters, LogStats } from "@/types/logs";

export function useLogs(filters: LogFilters, page: number = 0) {
  return useQuery({
    queryKey: ['logs', filters, page],
    queryFn: async () => {
      let query = supabase
        .from('logs_sistema')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters.busca) {
        query = query.ilike('descricao', `%${filters.busca}%`);
      }
      
      if (filters.usuario_id) {
        query = query.eq('usuario_id', filters.usuario_id);
      }
      
      if (filters.acao && filters.acao.length > 0) {
        query = query.in('acao', filters.acao);
      }
      
      if (filters.entidade_tipo && filters.entidade_tipo.length > 0) {
        query = query.in('entidade_tipo', filters.entidade_tipo);
      }
      
      if (filters.data_inicio) {
        query = query.gte('created_at', filters.data_inicio.toISOString());
      }
      
      if (filters.data_fim) {
        const endOfDay = new Date(filters.data_fim);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      query = query.range(page * 50, (page + 1) * 50 - 1);

      const { data: logsData, error, count } = await query;
      
      if (error) throw error;

      // Buscar informações dos usuários separadamente
      const userIds = [...new Set(logsData?.map(log => log.usuario_id).filter(Boolean))] as string[];
      let usersMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('profiles')
          .select('id, nome_completo, email, avatar_url')
          .in('id', userIds);

        if (users) {
          usersMap = users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Combinar logs com informações dos usuários
      const logs = (logsData || []).map(log => ({
        ...log,
        usuario: log.usuario_id ? usersMap[log.usuario_id] : undefined
      })) as unknown as LogSistema[];
      
      return {
        logs,
        total: count || 0
      };
    }
  });
}

export function useLogStats() {
  return useQuery({
    queryKey: ['log-stats'],
    queryFn: async () => {
      const { count: total } = await supabase
        .from('logs_sistema')
        .select('*', { count: 'exact', head: true });

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const { count: logs_hoje } = await supabase
        .from('logs_sistema')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', hoje.toISOString());

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: logs_semana } = await supabase
        .from('logs_sistema')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      const { data: logs } = await supabase
        .from('logs_sistema')
        .select('usuario_id')
        .not('usuario_id', 'is', null);

      const userIds = [...new Set(logs?.map(log => log.usuario_id).filter(Boolean))] as string[];
      let userNames: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('profiles')
          .select('id, nome_completo')
          .in('id', userIds);

        if (users) {
          userNames = users.reduce((acc, user) => {
            acc[user.id] = user.nome_completo;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      let usuario_mais_ativo: LogStats['usuario_mais_ativo'] = undefined;

      if (logs && logs.length > 0) {
        const userCounts = logs.reduce((acc, log) => {
          if (log.usuario_id) {
            acc[log.usuario_id] = (acc[log.usuario_id] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const mostActiveUserId = Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0];
        
        if (mostActiveUserId) {
          usuario_mais_ativo = {
            id: mostActiveUserId[0],
            nome: userNames[mostActiveUserId[0]] || 'Desconhecido',
            count: mostActiveUserId[1]
          };
        }
      }

      return {
        total_logs: total || 0,
        logs_hoje: logs_hoje || 0,
        logs_semana: logs_semana || 0,
        usuario_mais_ativo
      } as LogStats;
    }
  });
}

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios-for-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome_completo, email')
        .eq('ativo', true)
        .order('nome_completo');
      
      if (error) throw error;
      return data || [];
    }
  });
}

export function useCheckIsAdmin() {
  return useQuery({
    queryKey: ['is-admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      return !!data;
    }
  });
}
