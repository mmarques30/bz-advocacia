import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type PeriodoFiltro = 'este_mes' | '30d' | '90d' | 'todos';

export interface ExecutorRanking {
  nome: string;
  concluidas: number;
  pendentes: number;
  emAndamento: number;
  tempoMedio: number;
}

interface PendenteDemanda {
  id: string;
  titulo: string;
  advogada_responsavel: string;
  responsavel_nome: string;
  data_limite: string | null;
}

interface PendentesAgrupado {
  advogada: string;
  total: number;
  demandas: PendenteDemanda[];
}

export interface EvolucaoMensalExpanded {
  mes: string;
  concluidas: number;
  emAndamento: number;
  pendentes: number;
  total: number;
}

export interface ProdutividadeData {
  kpis: {
    totalConcluidas: number;
    tempoMedio: number;
    taxaConclusao: number;
    topExecutor: string;
  };
  rankingExecutores: ExecutorRanking[];
  pendentesAprovacao: PendentesAgrupado[];
  evolucaoMensal: EvolucaoMensalExpanded[];
}

function getDateRange(periodo: PeriodoFiltro) {
  const now = new Date();
  if (periodo === 'este_mes') {
    return { start: startOfMonth(now).toISOString(), end: endOfMonth(now).toISOString() };
  }
  if (periodo === '30d') {
    return { start: subMonths(now, 1).toISOString(), end: now.toISOString() };
  }
  if (periodo === '90d') {
    return { start: subMonths(now, 3).toISOString(), end: now.toISOString() };
  }
  return { start: null, end: null };
}

export interface ProdutividadeFiltros {
  periodo?: PeriodoFiltro;
  responsavelId?: string;
  tipo?: string;
}

export const useProdutividadeEquipe = (filtros: ProdutividadeFiltros = {}) => {
  const { periodo = 'este_mes', responsavelId, tipo } = filtros;

  return useQuery({
    queryKey: ['produtividade-equipe', periodo, responsavelId, tipo],
    queryFn: async (): Promise<ProdutividadeData> => {
      const { start, end } = getDateRange(periodo);

      // Fetch concluídas no período
      let concluidasQuery = supabase
        .from('demandas_internas')
        .select('*, responsavel:profiles!demandas_internas_responsavel_id_fkey(id, nome_completo)')
        .eq('status', 'concluido')
        .is('parent_id', null);

      if (start && end) {
        concluidasQuery = concluidasQuery.gte('data_conclusao', start.split('T')[0]).lte('data_conclusao', end.split('T')[0]);
      }
      if (responsavelId) concluidasQuery = concluidasQuery.eq('responsavel_id', responsavelId);
      if (tipo) concluidasQuery = concluidasQuery.eq('tipo', tipo);

      const { data: concluidas, error: e1 } = await concluidasQuery;
      if (e1) throw e1;

      // Fetch ativas (pendentes + em_andamento)
      let ativasQuery = supabase
        .from('demandas_internas')
        .select('*, responsavel:profiles!demandas_internas_responsavel_id_fkey(id, nome_completo)')
        .in('status', ['pendente', 'em_andamento'])
        .is('parent_id', null);

      if (responsavelId) ativasQuery = ativasQuery.eq('responsavel_id', responsavelId);
      if (tipo) ativasQuery = ativasQuery.eq('tipo', tipo);

      const { data: ativas, error: e2 } = await ativasQuery;
      if (e2) throw e2;

      // Fetch all profiles
      const { data: profiles } = await supabase.from('profiles').select('id, nome_completo').eq('ativo', true);

      const nameMap = new Map<string, string>();
      profiles?.forEach(p => nameMap.set(p.id, p.nome_completo?.split(' ')[0] || 'Sem nome'));

      // --- KPIs ---
      const totalConcluidas = concluidas?.length || 0;
      const totalAtivas = ativas?.length || 0;
      const taxaConclusao = (totalConcluidas + totalAtivas) > 0
        ? Math.round((totalConcluidas / (totalConcluidas + totalAtivas)) * 1000) / 10
        : 0;

      let tempoTotal = 0;
      let countTempo = 0;
      concluidas?.forEach(d => {
        if (d.data_conclusao && d.created_at) {
          const dias = differenceInDays(new Date(d.data_conclusao), new Date(d.created_at));
          tempoTotal += Math.max(dias, 0);
          countTempo++;
        }
      });
      const tempoMedio = countTempo > 0 ? Math.round((tempoTotal / countTempo) * 10) / 10 : 0;

      // --- Ranking por Executor ---
      const executorMap = new Map<string, ExecutorRanking>();
      const temposPorExecutor = new Map<string, number[]>();

      const getOrCreate = (id: string, nome?: string): ExecutorRanking => {
        if (!executorMap.has(id)) {
          executorMap.set(id, {
            nome: nome || nameMap.get(id) || 'Sem nome',
            concluidas: 0, pendentes: 0, emAndamento: 0, tempoMedio: 0,
          });
        }
        return executorMap.get(id)!;
      };

      concluidas?.forEach(d => {
        if (!d.responsavel_id) return;
        const exec = getOrCreate(d.responsavel_id, d.responsavel?.nome_completo?.split(' ')[0]);
        exec.concluidas++;
        if (d.data_conclusao && d.created_at) {
          const dias = differenceInDays(new Date(d.data_conclusao), new Date(d.created_at));
          if (!temposPorExecutor.has(d.responsavel_id)) temposPorExecutor.set(d.responsavel_id, []);
          temposPorExecutor.get(d.responsavel_id)!.push(Math.max(dias, 0));
        }
      });

      ativas?.forEach(d => {
        if (!d.responsavel_id) return;
        const exec = getOrCreate(d.responsavel_id, d.responsavel?.nome_completo?.split(' ')[0]);
        if (d.status === 'pendente') exec.pendentes++;
        if (d.status === 'em_andamento') exec.emAndamento++;
      });

      executorMap.forEach((exec, id) => {
        const tempos = temposPorExecutor.get(id);
        if (tempos && tempos.length > 0) {
          exec.tempoMedio = Math.round((tempos.reduce((a, b) => a + b, 0) / tempos.length) * 10) / 10;
        }
      });

      const rankingExecutores = Array.from(executorMap.values())
        .filter(e => e.concluidas > 0 || e.pendentes > 0 || e.emAndamento > 0)
        .sort((a, b) => b.concluidas - a.concluidas);

      const topExecutor = rankingExecutores.length > 0 ? rankingExecutores[0].nome : '-';

      // --- Pendentes Aprovação (em_andamento, agrupadas por advogada) ---
      const emAndamento = ativas?.filter(d => d.status === 'em_andamento') || [];
      const pendentesMap = new Map<string, PendenteDemanda[]>();

      emAndamento.forEach(d => {
        const adv = d.advogada_responsavel || 'Sem advogada';
        if (!pendentesMap.has(adv)) pendentesMap.set(adv, []);
        pendentesMap.get(adv)!.push({
          id: d.id,
          titulo: d.titulo,
          advogada_responsavel: adv,
          responsavel_nome: d.responsavel?.nome_completo?.split(' ')[0] || 'Sem responsável',
          data_limite: d.data_limite,
        });
      });

      const ADVOGADA_LABELS: Record<string, string> = { juliana: 'Juliana', liziane: 'Liziane' };
      const pendentesAprovacao: PendentesAgrupado[] = Array.from(pendentesMap.entries())
        .map(([adv, demandas]) => ({
          advogada: ADVOGADA_LABELS[adv] || adv,
          total: demandas.length,
          demandas,
        }))
        .sort((a, b) => b.total - a.total);

      // --- Evolução Mensal Expandida (últimos 6 meses) ---
      const now = new Date();
      const evolucaoMensal: EvolucaoMensalExpanded[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const mStart = startOfMonth(monthDate);
        const mEnd = endOfMonth(monthDate);
        const label = format(monthDate, 'MMM/yy', { locale: ptBR });

        const { data: monthConcluidas } = await supabase
          .from('demandas_internas')
          .select('id')
          .eq('status', 'concluido')
          .is('parent_id', null)
          .gte('data_conclusao', mStart.toISOString().split('T')[0])
          .lte('data_conclusao', mEnd.toISOString().split('T')[0]);

        const { data: monthCriadas } = await supabase
          .from('demandas_internas')
          .select('id, status')
          .is('parent_id', null)
          .gte('created_at', mStart.toISOString())
          .lte('created_at', mEnd.toISOString());

        const conc = monthConcluidas?.length || 0;
        const emAnd = monthCriadas?.filter(d => d.status === 'em_andamento').length || 0;
        const pend = monthCriadas?.filter(d => d.status === 'pendente').length || 0;

        evolucaoMensal.push({
          mes: label,
          concluidas: conc,
          emAndamento: emAnd,
          pendentes: pend,
          total: conc + emAnd + pend,
        });
      }

      return {
        kpis: { totalConcluidas, tempoMedio, taxaConclusao, topExecutor },
        rankingExecutores,
        pendentesAprovacao,
        evolucaoMensal,
      };
    },
  });
};
