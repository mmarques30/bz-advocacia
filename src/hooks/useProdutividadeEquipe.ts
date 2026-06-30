import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type PeriodoFiltro = 'esta_semana' | 'este_mes' | '30d' | '90d' | 'todos';

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
  if (periodo === 'esta_semana') {
    return { start: startOfWeek(now, { weekStartsOn: 1 }).toISOString(), end: endOfWeek(now, { weekStartsOn: 1 }).toISOString() };
  }
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
      const now = new Date();

      // Janela fixa de 6 meses para o gráfico de evolução (independe do
      // período selecionado nos filtros).
      const evoInicio = startOfMonth(subMonths(now, 5));
      const evoFim = endOfMonth(now);

      // Concluídas no período (KPIs + ranking). Só as colunas usadas.
      let concluidasQuery = supabase
        .from('demandas_internas')
        .select('responsavel_id, concluida_em, created_at')
        .eq('status', 'concluido')
        .is('parent_id', null);
      if (start && end) {
        concluidasQuery = concluidasQuery.gte('data_conclusao', start.split('T')[0]).lte('data_conclusao', end.split('T')[0]);
      }
      if (responsavelId) concluidasQuery = concluidasQuery.eq('responsavel_id', responsavelId);
      if (tipo) concluidasQuery = concluidasQuery.eq('tipo', tipo);

      // Ativas (pendentes + em_andamento). Só as colunas usadas.
      let ativasQuery = supabase
        .from('demandas_internas')
        .select('id, titulo, status, responsavel_id, advogada_responsavel, data_limite')
        .in('status', ['pendente', 'em_andamento'])
        .is('parent_id', null);
      if (responsavelId) ativasQuery = ativasQuery.eq('responsavel_id', responsavelId);
      if (tipo) ativasQuery = ativasQuery.eq('tipo', tipo);

      // Janela de evolução em 2 queries (concluídas por data_conclusao +
      // criadas por created_at). Antes eram 12 queries sequenciais dentro
      // de um for — a principal causa da lentidão ao abrir a aba.
      const evoConcluidasQuery = supabase
        .from('demandas_internas')
        .select('data_conclusao')
        .eq('status', 'concluido')
        .is('parent_id', null)
        .gte('data_conclusao', evoInicio.toISOString().split('T')[0])
        .lte('data_conclusao', evoFim.toISOString().split('T')[0]);

      const evoCriadasQuery = supabase
        .from('demandas_internas')
        .select('status, created_at')
        .is('parent_id', null)
        .gte('created_at', evoInicio.toISOString())
        .lte('created_at', evoFim.toISOString());

      const profilesQuery = supabase
        .from('profiles')
        .select('id, nome_completo')
        .eq('ativo', true);

      // Tudo em paralelo (1 round-trip de rede em vez de ~15 sequenciais).
      const [
        concluidasRes,
        ativasRes,
        evoConcluidasRes,
        evoCriadasRes,
        profilesRes,
      ] = await Promise.all([
        concluidasQuery,
        ativasQuery,
        evoConcluidasQuery,
        evoCriadasQuery,
        profilesQuery,
      ]);

      if (concluidasRes.error) throw concluidasRes.error;
      if (ativasRes.error) throw ativasRes.error;

      const concluidas = concluidasRes.data;
      const ativas = ativasRes.data;
      const profiles = profilesRes.data;
      const evoConcluidas = evoConcluidasRes.data;
      const evoCriadas = evoCriadasRes.data;

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
        if (d.concluida_em && d.created_at) {
          const dias = differenceInDays(new Date(d.concluida_em), new Date(d.created_at));
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
        const exec = getOrCreate(d.responsavel_id, nameMap.get(d.responsavel_id));
        exec.concluidas++;
        if (d.concluida_em && d.created_at) {
          const dias = differenceInDays(new Date(d.concluida_em), new Date(d.created_at));
          if (!temposPorExecutor.has(d.responsavel_id)) temposPorExecutor.set(d.responsavel_id, []);
          temposPorExecutor.get(d.responsavel_id)!.push(Math.max(dias, 0));
        }
      });

      ativas?.forEach(d => {
        if (!d.responsavel_id) return;
        const exec = getOrCreate(d.responsavel_id, nameMap.get(d.responsavel_id));
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
          responsavel_nome: nameMap.get(d.responsavel_id) || 'Sem responsável',
          data_limite: d.data_limite,
        });
      });

      // Build dynamic labels from profiles.
      // Legacy fallback is hardcoded so the UI stays nominal mesmo se a
      // query falhar ou o banco nao tiver profiles populados ainda.
      // Fase B do refactor de advogadas (ver docs/migracao-advogadas-hardcoded.md):
      // a fonte real e profiles.is_advogada, resolvida por useAdvogadas().
      const advLabels: Record<string, string> = { juliana: 'Juliana Borges', liziane: 'Eliziane Taborda' };
      profiles?.forEach(p => {
        const nome = p.nome_completo.toLowerCase();
        if (nome.startsWith('juliana')) advLabels.juliana = p.nome_completo;
        else if (nome.startsWith('eliziane')) advLabels.liziane = p.nome_completo;
      });
      const pendentesAprovacao: PendentesAgrupado[] = Array.from(pendentesMap.entries())
        .map(([adv, demandas]) => ({
          advogada: advLabels[adv] || adv,
          total: demandas.length,
          demandas,
        }))
        .sort((a, b) => b.total - a.total);

      // --- Evolução Mensal Expandida (últimos 6 meses) ---
      // Agrupa em memória os dados já buscados (chave yyyy-MM via prefixo da
      // data, evitando deslocamento de fuso).
      const evoConcMap = new Map<string, number>();
      (evoConcluidas || []).forEach(d => {
        if (!d.data_conclusao) return;
        const k = String(d.data_conclusao).slice(0, 7);
        evoConcMap.set(k, (evoConcMap.get(k) || 0) + 1);
      });
      const evoEmAndMap = new Map<string, number>();
      const evoPendMap = new Map<string, number>();
      (evoCriadas || []).forEach(d => {
        if (!d.created_at) return;
        const k = String(d.created_at).slice(0, 7);
        if (d.status === 'em_andamento') evoEmAndMap.set(k, (evoEmAndMap.get(k) || 0) + 1);
        else if (d.status === 'pendente') evoPendMap.set(k, (evoPendMap.get(k) || 0) + 1);
      });

      const evolucaoMensal: EvolucaoMensalExpanded[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const k = format(monthDate, 'yyyy-MM');
        const label = format(monthDate, 'MMM/yy', { locale: ptBR });
        const conc = evoConcMap.get(k) || 0;
        const emAnd = evoEmAndMap.get(k) || 0;
        const pend = evoPendMap.get(k) || 0;
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
