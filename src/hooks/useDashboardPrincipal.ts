import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PrazoUrgencia {
  atrasados: number;
  hoje: number;
  estaSemana: number;
  trintaDias: number;
}

export interface PrazoTipoDistribuicao {
  tipo: string;
  count: number;
}

export interface CargaAdvogada {
  id: string;
  nome: string;
  iniciais: string;
  processos: number;
  prazosHoje: number;
}

export interface PrazoProximoEnriquecido {
  id: string;
  processo_id: string;
  numero_processo: string | null;
  tipo_prazo: string;
  descricao: string;
  data_prazo: string;
  dias_restantes: number;
  prioridade: string;
  cliente_nome: string | null;
  advogada_nome: string | null;
}

export interface ProcessoSemMovimentacao {
  id: string;
  numero_processo: string | null;
  autor: string | null;
  reu: string | null;
  dias_sem_atualizacao: number;
}

export interface StatusProcessos {
  emAndamento: number;
  concluidos: number;
  arquivados: number;
}

export interface DashboardPrincipalData {
  prazosUrgencia: PrazoUrgencia;
  prazosTipoDistribuicao: PrazoTipoDistribuicao[];
  cargaAdvogadas: CargaAdvogada[];
  proximosPrazos: PrazoProximoEnriquecido[];
  statusProcessos: StatusProcessos;
  processosSemMovimentacao: ProcessoSemMovimentacao[];
  totalSemMovimentacao: number;
  prazosHojeCount: number;
}

function getEndOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function useDashboardPrincipal() {
  return useQuery({
    queryKey: ["dashboard-principal"],
    queryFn: async (): Promise<DashboardPrincipalData> => {
      const hoje = new Date();
      const hojeISO = hoje.toISOString().split("T")[0];
      const fimSemana = getEndOfWeek(hoje);
      const fimSemanaISO = fimSemana.toISOString().split("T")[0];
      const em30Dias = new Date(hoje);
      em30Dias.setDate(em30Dias.getDate() + 30);
      const em30DiasISO = em30Dias.toISOString().split("T")[0];
      const ha30Dias = new Date(hoje);
      ha30Dias.setDate(ha30Dias.getDate() - 30);

      // Parallel queries
      const [
        prazosAtrasadosResult,
        prazosHojeResult,
        prazosSemanaResult,
        prazos30DiasResult,
        allPrazosPendentesResult,
        processosResult,
        processosSemMovResult,
        processosSemMovCountResult,
        proximosPrazosResult,
      ] = await Promise.all([
        // Atrasados
        supabase
          .from("processos_prazos")
          .select("id", { count: "exact", head: true })
          .eq("status", "pendente")
          .lt("data_prazo", hojeISO),
        // Hoje
        supabase
          .from("processos_prazos")
          .select("id", { count: "exact", head: true })
          .eq("status", "pendente")
          .eq("data_prazo", hojeISO),
        // Esta semana (hoje até domingo)
        supabase
          .from("processos_prazos")
          .select("id", { count: "exact", head: true })
          .eq("status", "pendente")
          .gte("data_prazo", hojeISO)
          .lte("data_prazo", fimSemanaISO),
        // 30 dias
        supabase
          .from("processos_prazos")
          .select("id", { count: "exact", head: true })
          .eq("status", "pendente")
          .gt("data_prazo", fimSemanaISO)
          .lte("data_prazo", em30DiasISO),
        // All pending prazos for type distribution
        supabase
          .from("processos_prazos")
          .select("tipo_prazo")
          .eq("status", "pendente")
          .gte("data_prazo", hojeISO)
          .lte("data_prazo", em30DiasISO),
        // Processos by status
        supabase.from("processos").select("status, responsavel_id"),
        // Processos sem movimentação (top 3)
        supabase
          .from("processos")
          .select("id, numero_processo, autor, reu, data_ultima_atualizacao")
          .eq("status", "em_andamento")
          .or(`data_ultima_atualizacao.lt.${ha30Dias.toISOString()},data_ultima_atualizacao.is.null`)
          .order("data_ultima_atualizacao", { ascending: true, nullsFirst: true })
          .limit(3),
        // Count total sem movimentação
        supabase
          .from("processos")
          .select("id", { count: "exact", head: true })
          .eq("status", "em_andamento")
          .or(`data_ultima_atualizacao.lt.${ha30Dias.toISOString()},data_ultima_atualizacao.is.null`),
        // Próximos prazos enriched (next 8)
        supabase
          .from("processos_prazos")
          .select("id, processo_id, tipo_prazo, descricao, data_prazo, prioridade, responsavel_id")
          .eq("status", "pendente")
          .gte("data_prazo", hojeISO)
          .order("data_prazo", { ascending: true })
          .limit(8),
      ]);

      // Build urgency counts
      const prazosUrgencia: PrazoUrgencia = {
        atrasados: prazosAtrasadosResult.count || 0,
        hoje: prazosHojeResult.count || 0,
        estaSemana: prazosSemanaResult.count || 0,
        trintaDias: prazos30DiasResult.count || 0,
      };

      // Type distribution
      const tipoCount: Record<string, number> = {};
      (allPrazosPendentesResult.data || []).forEach((p) => {
        const tipo = normalizeTipoPrazo(p.tipo_prazo);
        tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;
      });
      const prazosTipoDistribuicao: PrazoTipoDistribuicao[] = Object.entries(tipoCount)
        .map(([tipo, count]) => ({ tipo, count }))
        .sort((a, b) => b.count - a.count);

      // Status processos
      const processosData = processosResult.data || [];
      const statusProcessos: StatusProcessos = {
        emAndamento: processosData.filter((p) => p.status === "em_andamento").length,
        concluidos: processosData.filter((p) => p.status === "concluido").length,
        arquivados: processosData.filter((p) => p.status === "arquivado").length,
      };

      // Carga por advogada: count processos em_andamento by responsavel_id
      const processosEmAndamento = processosData.filter((p) => p.status === "em_andamento");
      const responsavelProcessoCount: Record<string, number> = {};
      processosEmAndamento.forEach((p) => {
        if (p.responsavel_id) {
          responsavelProcessoCount[p.responsavel_id] = (responsavelProcessoCount[p.responsavel_id] || 0) + 1;
        }
      });

      // Get prazos hoje by responsável
      const { data: prazosHojeDetalhes } = await supabase
        .from("processos_prazos")
        .select("responsavel_id")
        .eq("status", "pendente")
        .eq("data_prazo", hojeISO);

      const responsavelPrazosHoje: Record<string, number> = {};
      (prazosHojeDetalhes || []).forEach((p) => {
        if (p.responsavel_id) {
          responsavelPrazosHoje[p.responsavel_id] = (responsavelPrazosHoje[p.responsavel_id] || 0) + 1;
        }
      });

      // Get unique responsavel IDs
      const allResponsavelIds = [
        ...new Set([
          ...Object.keys(responsavelProcessoCount),
          ...Object.keys(responsavelPrazosHoje),
        ]),
      ];

      let cargaAdvogadas: CargaAdvogada[] = [];
      if (allResponsavelIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nome_completo")
          .in("id", allResponsavelIds);

        cargaAdvogadas = (profiles || []).map((p) => {
          const nome = p.nome_completo || "Sem nome";
          const partes = nome.split(" ");
          const iniciais = partes.length >= 2
            ? (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
            : nome.substring(0, 2).toUpperCase();
          return {
            id: p.id,
            nome,
            iniciais,
            processos: responsavelProcessoCount[p.id] || 0,
            prazosHoje: responsavelPrazosHoje[p.id] || 0,
          };
        }).sort((a, b) => b.processos - a.processos);
      }

      // Enrich próximos prazos with client name and advogada name
      const prazoData = proximosPrazosResult.data || [];
      const processoIds = [...new Set(prazoData.map((p) => p.processo_id))];
      const responsavelIds = [...new Set(prazoData.map((p) => p.responsavel_id).filter(Boolean))];

      let processosMap: Record<string, { numero_processo: string | null; lead_id: string | null; responsavel_id: string | null }> = {};
      if (processoIds.length > 0) {
        const { data } = await supabase
          .from("processos")
          .select("id, numero_processo, lead_id, responsavel_id")
          .in("id", processoIds);
        (data || []).forEach((p) => {
          processosMap[p.id] = { numero_processo: p.numero_processo, lead_id: p.lead_id, responsavel_id: p.responsavel_id };
        });
      }

      // Get client names from lead_ids
      const leadIds = [...new Set(Object.values(processosMap).map((p) => p.lead_id).filter(Boolean))] as string[];
      let clientesMap: Record<string, string> = {};
      if (leadIds.length > 0) {
        const { data } = await supabase
          .from("contact_submissions")
          .select("id, nome_completo")
          .in("id", leadIds);
        (data || []).forEach((c) => {
          clientesMap[c.id] = c.nome_completo;
        });
      }

      // Get advogada names
      const allPrazoResponsavelIds = [
        ...new Set([
          ...responsavelIds,
          ...Object.values(processosMap).map((p) => p.responsavel_id).filter(Boolean),
        ] as string[]),
      ];
      let advogadasMap: Record<string, string> = {};
      if (allPrazoResponsavelIds.length > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("id, nome_completo")
          .in("id", allPrazoResponsavelIds);
        (data || []).forEach((a) => {
          advogadasMap[a.id] = a.nome_completo;
        });
      }

      const proximosPrazos: PrazoProximoEnriquecido[] = prazoData.map((p) => {
        const proc = processosMap[p.processo_id];
        const diasRestantes = Math.ceil(
          (new Date(p.data_prazo).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        );
        const advId = p.responsavel_id || proc?.responsavel_id;
        return {
          id: p.id,
          processo_id: p.processo_id,
          numero_processo: proc?.numero_processo || null,
          tipo_prazo: p.tipo_prazo,
          descricao: p.descricao,
          data_prazo: p.data_prazo,
          dias_restantes: diasRestantes,
          prioridade: p.prioridade || "media",
          cliente_nome: proc?.lead_id ? clientesMap[proc.lead_id] || null : null,
          advogada_nome: advId ? advogadasMap[advId] || null : null,
        };
      });

      // Processos sem movimentação
      const processosSemMovimentacao: ProcessoSemMovimentacao[] = (processosSemMovResult.data || []).map((p) => {
        const lastUpdate = p.data_ultima_atualizacao ? new Date(p.data_ultima_atualizacao) : null;
        const diasSem = lastUpdate
          ? Math.floor((hoje.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        return {
          id: p.id,
          numero_processo: p.numero_processo,
          autor: p.autor,
          reu: p.reu,
          dias_sem_atualizacao: diasSem,
        };
      });

      return {
        prazosUrgencia,
        prazosTipoDistribuicao,
        cargaAdvogadas,
        proximosPrazos,
        statusProcessos,
        processosSemMovimentacao,
        totalSemMovimentacao: processosSemMovCountResult.count || 0,
        prazosHojeCount: prazosHojeResult.count || 0,
      };
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

function normalizeTipoPrazo(tipo: string): string {
  const lower = tipo.toLowerCase();
  if (lower.includes("peti")) return "Petição";
  if (lower.includes("audi")) return "Audiência";
  if (lower.includes("recur")) return "Recurso";
  if (lower.includes("contestação") || lower.includes("contestacao")) return "Contestação";
  if (lower.includes("manifestação") || lower.includes("manifestacao")) return "Manifestação";
  return tipo.charAt(0).toUpperCase() + tipo.slice(1);
}
