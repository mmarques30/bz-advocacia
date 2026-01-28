import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, differenceInDays, isBefore } from "date-fns";

interface ResponsavelDistribuicao {
  id: string;
  nome: string;
  total: number;
  atrasadas: number;
  concluidas: number;
  emAndamento: number;
}

interface PerformanceData {
  taxaConclusao: number;
  tempoMedioConclusao: number;
  criadasNoMes: number;
  concluidasNoMes: number;
  distribuicaoPorResponsavel: ResponsavelDistribuicao[];
}

export const useDemandasPerformance = () => {
  return useQuery({
    queryKey: ['demandas-performance'],
    queryFn: async (): Promise<PerformanceData> => {
      const today = new Date();
      const monthStart = startOfMonth(today).toISOString().split('T')[0];
      const monthEnd = endOfMonth(today).toISOString().split('T')[0];

      // Buscar todas as demandas do mês com responsável
      const { data: demandas, error: demandasError } = await supabase
        .from('demandas_internas')
        .select(`
          *,
          responsavel:profiles!demandas_internas_responsavel_id_fkey(id, nome_completo)
        `)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd + 'T23:59:59');

      if (demandasError) throw demandasError;

      // Buscar demandas concluídas no mês (independente de quando foram criadas)
      const { data: concluidas, error: concluidasError } = await supabase
        .from('demandas_internas')
        .select(`
          *,
          responsavel:profiles!demandas_internas_responsavel_id_fkey(id, nome_completo)
        `)
        .eq('status', 'concluido')
        .gte('data_conclusao', monthStart)
        .lte('data_conclusao', monthEnd);

      if (concluidasError) throw concluidasError;

      // Buscar todas as demandas ativas para distribuição
      const { data: ativas, error: ativasError } = await supabase
        .from('demandas_internas')
        .select(`
          *,
          responsavel:profiles!demandas_internas_responsavel_id_fkey(id, nome_completo)
        `)
        .not('status', 'eq', 'cancelado');

      if (ativasError) throw ativasError;

      // Buscar perfis para garantir que temos todos os responsáveis
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome_completo')
        .eq('ativo', true);

      // Calcular métricas
      const criadasNoMes = demandas?.length || 0;
      const concluidasNoMes = concluidas?.length || 0;

      // Taxa de conclusão (concluídas / total de demandas ativas no mês)
      const totalAtivasNoMes = demandas?.filter(d => d.status !== 'cancelado').length || 0;
      const taxaConclusao = totalAtivasNoMes > 0 
        ? (concluidasNoMes / totalAtivasNoMes) * 100 
        : 0;

      // Tempo médio de conclusão
      let tempoTotal = 0;
      let countConcluidas = 0;

      concluidas?.forEach(d => {
        if (d.data_conclusao && d.created_at) {
          const dias = differenceInDays(
            new Date(d.data_conclusao),
            new Date(d.created_at)
          );
          tempoTotal += Math.max(dias, 0);
          countConcluidas++;
        }
      });

      const tempoMedioConclusao = countConcluidas > 0 
        ? tempoTotal / countConcluidas 
        : 0;

      // Distribuição por responsável
      const distribuicaoMap = new Map<string, ResponsavelDistribuicao>();

      // Inicializar com todos os perfis ativos
      profiles?.forEach(p => {
        distribuicaoMap.set(p.id, {
          id: p.id,
          nome: p.nome_completo?.split(' ')[0] || 'Sem nome',
          total: 0,
          atrasadas: 0,
          concluidas: 0,
          emAndamento: 0,
        });
      });

      // Processar demandas ativas
      ativas?.forEach(d => {
        if (!d.responsavel_id) return;

        const resp = distribuicaoMap.get(d.responsavel_id);
        if (!resp) {
          // Criar entrada para responsável não listado
          distribuicaoMap.set(d.responsavel_id, {
            id: d.responsavel_id,
            nome: d.responsavel?.nome_completo?.split(' ')[0] || 'Sem nome',
            total: 0,
            atrasadas: 0,
            concluidas: 0,
            emAndamento: 0,
          });
        }

        const current = distribuicaoMap.get(d.responsavel_id)!;
        current.total++;

        if (d.status === 'concluido') {
          current.concluidas++;
        } else if (d.status === 'em_andamento') {
          current.emAndamento++;
          // Verificar se está atrasada
          if (d.data_limite && isBefore(new Date(d.data_limite), today)) {
            current.atrasadas++;
          }
        } else if (d.status === 'pendente') {
          // Verificar se está atrasada
          if (d.data_limite && isBefore(new Date(d.data_limite), today)) {
            current.atrasadas++;
          }
        }
      });

      // Converter para array e filtrar apenas quem tem demandas
      const distribuicaoPorResponsavel = Array.from(distribuicaoMap.values())
        .filter(d => d.total > 0)
        .sort((a, b) => b.total - a.total);

      return {
        taxaConclusao: Math.round(taxaConclusao * 10) / 10,
        tempoMedioConclusao: Math.round(tempoMedioConclusao * 10) / 10,
        criadasNoMes,
        concluidasNoMes,
        distribuicaoPorResponsavel,
      };
    },
  });
};
