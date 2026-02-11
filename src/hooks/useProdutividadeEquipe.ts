import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, subMonths, startOfMonth, endOfMonth, format, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

export type PeriodoFiltro = 'este_mes' | '30d' | '90d' | 'todos';

interface ExecutorRanking {
  nome: string;
  concluidas: number;
  pendentes: number;
  emAndamento: number;
  tempoMedio: number;
}

interface AdvogadaData {
  advogada: string;
  concluidas: number;
  pendentes: number;
  emAndamento: number;
}

interface EvolucaoMensal {
  mes: string;
  concluidas: number;
}

interface ProdutividadeData {
  kpis: {
    totalConcluidas: number;
    tempoMedio: number;
    taxaConclusao: number;
    topExecutor: string;
  };
  rankingExecutores: ExecutorRanking[];
  distribuicaoCarga: ExecutorRanking[];
  porAdvogada: AdvogadaData[];
  evolucaoMensal: EvolucaoMensal[];
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

export const useProdutividadeEquipe = (periodo: PeriodoFiltro = 'este_mes') => {
  return useQuery({
    queryKey: ['produtividade-equipe', periodo],
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

      const { data: concluidas, error: e1 } = await concluidasQuery;
      if (e1) throw e1;

      // Fetch ativas (pendentes + em_andamento)
      const { data: ativas, error: e2 } = await supabase
        .from('demandas_internas')
        .select('*, responsavel:profiles!demandas_internas_responsavel_id_fkey(id, nome_completo)')
        .in('status', ['pendente', 'em_andamento'])
        .is('parent_id', null);
      if (e2) throw e2;

      // Fetch all profiles
      const { data: profiles } = await supabase.from('profiles').select('id, nome_completo').eq('ativo', true);

      // Build profile name map
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

      // --- Ranking por Executor (responsavel_id) ---
      const executorMap = new Map<string, ExecutorRanking>();

      const getOrCreate = (id: string, nome?: string): ExecutorRanking => {
        if (!executorMap.has(id)) {
          executorMap.set(id, {
            nome: nome || nameMap.get(id) || 'Sem nome',
            concluidas: 0, pendentes: 0, emAndamento: 0, tempoMedio: 0,
          });
        }
        return executorMap.get(id)!;
      };

      const temposPorExecutor = new Map<string, number[]>();

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

      // Calc tempo medio por executor
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

      // --- Por Advogada Responsável ---
      const advMap = new Map<string, AdvogadaData>();

      const getOrCreateAdv = (adv: string): AdvogadaData => {
        if (!advMap.has(adv)) {
          advMap.set(adv, { advogada: adv, concluidas: 0, pendentes: 0, emAndamento: 0 });
        }
        return advMap.get(adv)!;
      };

      concluidas?.forEach(d => {
        if (!d.advogada_responsavel) return;
        getOrCreateAdv(d.advogada_responsavel).concluidas++;
      });

      ativas?.forEach(d => {
        if (!d.advogada_responsavel) return;
        const a = getOrCreateAdv(d.advogada_responsavel);
        if (d.status === 'pendente') a.pendentes++;
        if (d.status === 'em_andamento') a.emAndamento++;
      });

      const porAdvogada = Array.from(advMap.values()).sort((a, b) => b.concluidas - a.concluidas);

      // --- Evolução Mensal (últimos 6 meses) ---
      const now = new Date();
      const evolucaoMensal: EvolucaoMensal[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const mStart = startOfMonth(monthDate);
        const mEnd = endOfMonth(monthDate);
        const label = format(monthDate, 'MMM/yy', { locale: ptBR });

        const { data: monthData } = await supabase
          .from('demandas_internas')
          .select('id')
          .eq('status', 'concluido')
          .is('parent_id', null)
          .gte('data_conclusao', mStart.toISOString().split('T')[0])
          .lte('data_conclusao', mEnd.toISOString().split('T')[0]);

        evolucaoMensal.push({ mes: label, concluidas: monthData?.length || 0 });
      }

      return {
        kpis: { totalConcluidas, tempoMedio, taxaConclusao, topExecutor },
        rankingExecutores,
        distribuicaoCarga: rankingExecutores,
        porAdvogada,
        evolucaoMensal,
      };
    },
  });
};
