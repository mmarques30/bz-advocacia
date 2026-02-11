import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ProcessosPorStatus {
  emAndamento: number;
  concluidos: number;
  arquivados: number;
}

export interface PrazoProximo {
  id: string;
  processo_id: string;
  numero_processo: string | null;
  tipo_prazo: string;
  descricao: string;
  data_prazo: string;
  dias_restantes: number;
  prioridade: string;
}

export interface PipelineEstagio {
  estagio: string;
  label: string;
  count: number;
}

export interface LeadRecente {
  id: string;
  nome_completo: string;
  tipo_processo: string;
  estagio: string | null;
  created_at: string;
}

export interface PropostaAcao {
  id: string;
  tipo: "processo" | "vendas" | "tarefa" | "prazo";
  icone: string;
  titulo: string;
  descricao: string;
  link: string;
  severidade: "info" | "warning" | "error";
}

export interface DemandaDistribuicao {
  nome: string;
  total: number;
  concluidas: number;
}

export interface LeadsEvolutionItem {
  mes: string;
  atual: number;
  anterior: number;
}

export interface ProcessoSemAtualizacao {
  id: string;
  numero_processo: string | null;
  tipo: string;
  autor: string | null;
  reu: string | null;
  data_ultima_atualizacao: string | null;
  dias_sem_atualizacao: number;
}

export interface DashboardCompletoData {
  processos: ProcessosPorStatus;
  proximosPrazos: PrazoProximo[];
  pipeline: PipelineEstagio[];
  leadsRecentes: LeadRecente[];
  propostas: PropostaAcao[];
  processosSemAtualizacao: ProcessoSemAtualizacao[];
  totalClientes: number;
  totalLeadsMes: number;
  taxaConversao: number;
  demandasPendentes: number;
  leadsEvolution: LeadsEvolutionItem[];
}

export function useDashboardCompleto() {
  return useQuery({
    queryKey: ["dashboard-completo"],
    queryFn: async (): Promise<DashboardCompletoData> => {
      const hoje = new Date();
      const hojeISO = hoje.toISOString().split("T")[0];
      const em14Dias = new Date(hoje);
      em14Dias.setDate(em14Dias.getDate() + 14);
      const em14DiasISO = em14Dias.toISOString().split("T")[0];
      const ha30Dias = new Date(hoje);
      ha30Dias.setDate(ha30Dias.getDate() - 30);
      const ha7Dias = new Date(hoje);
      ha7Dias.setDate(ha7Dias.getDate() - 7);
      const inicioMes = startOfMonth(hoje).toISOString();
      const fimMes = endOfMonth(hoje).toISOString();

      // Execute all queries in parallel
      const [
        processosResult,
        prazosResult,
        leadsResult,
        leadsRecentesResult,
        processosAtrasadosResult,
        leadsParadosResult,
        demandasAtrasadasResult,
        totalClientesResult,
        totalLeadsMesResult,
        convertidosMesResult,
        demandasPendentesResult,
      ] = await Promise.all([
        // 1. Processos por status
        supabase.from("processos").select("status"),

        // 2. Próximos prazos (14 dias)
        supabase
          .from("processos_prazos")
          .select("id, processo_id, tipo_prazo, descricao, data_prazo, prioridade, status")
          .eq("status", "pendente")
          .gte("data_prazo", hojeISO)
          .lte("data_prazo", em14DiasISO)
          .order("data_prazo", { ascending: true })
          .limit(8),

        // 3. Leads por estágio (pipeline) - excluir importados
        supabase
          .from("contact_submissions")
          .select("estagio")
          .neq("como_conheceu", "importacao")
          .neq("estagio", "fechado"),

        // 4. Leads recentes
        supabase
          .from("contact_submissions")
          .select("id, nome_completo, tipo_processo, estagio, created_at")
          .neq("como_conheceu", "importacao")
          .order("created_at", { ascending: false })
          .limit(5),

        // 5. Processos sem atualização há 30+ dias (dados completos)
        supabase
          .from("processos")
          .select("id, numero_processo, tipo, autor, reu, data_ultima_atualizacao")
          .eq("status", "em_andamento")
          .lt("data_ultima_atualizacao", ha30Dias.toISOString())
          .order("data_ultima_atualizacao", { ascending: true })
          .limit(5),

        // 6. Leads parados há 7+ dias
        supabase
          .from("contact_submissions")
          .select("id", { count: "exact", head: true })
          .lt("data_ultima_atividade", ha7Dias.toISOString())
          .neq("status", "cliente")
          .neq("status", "perdido")
          .neq("como_conheceu", "importacao"),

        // 7. Demandas atrasadas
        supabase
          .from("demandas_internas")
          .select("id", { count: "exact", head: true })
          .in("status", ["pendente", "em_andamento"])
          .lt("data_limite", hojeISO),

        // 8. Total clientes ativos
        supabase
          .from("contact_submissions")
          .select("id", { count: "exact", head: true })
          .eq("estagio", "fechado"),

        // 9. Total leads do mês
        supabase
          .from("contact_submissions")
          .select("id", { count: "exact", head: true })
          .neq("como_conheceu", "importacao")
          .gte("created_at", inicioMes)
          .lte("created_at", fimMes),

        // 10. Convertidos no mês (para taxa de conversão)
        supabase
          .from("contact_submissions")
          .select("id", { count: "exact", head: true })
          .eq("estagio", "fechado")
          .neq("como_conheceu", "importacao")
          .gte("created_at", inicioMes)
          .lte("created_at", fimMes),

        // 11. Demandas pendentes total
        supabase
          .from("demandas_internas")
          .select("id", { count: "exact", head: true })
          .in("status", ["pendente", "em_andamento"]),
      ]);

      // Fetch processo numbers for prazos
      const prazoProcessoIds = (prazosResult.data || []).map((p) => p.processo_id);
      let processosMap: Record<string, string | null> = {};
      if (prazoProcessoIds.length > 0) {
        const { data: processosData } = await supabase
          .from("processos")
          .select("id, numero_processo")
          .in("id", prazoProcessoIds);
        processosMap = (processosData || []).reduce(
          (acc, p) => ({ ...acc, [p.id]: p.numero_processo }),
          {} as Record<string, string | null>
        );
      }

      // Leads evolution (6 months)
      const leadsEvolution: LeadsEvolutionItem[] = [];
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(hoje, i);
        const prevYear = subMonths(hoje, i + 12);
        const [atual, anterior] = await Promise.all([
          supabase
            .from("contact_submissions")
            .select("id", { count: "exact", head: true })
            .neq("como_conheceu", "importacao")
            .gte("created_at", startOfMonth(month).toISOString())
            .lte("created_at", endOfMonth(month).toISOString()),
          supabase
            .from("contact_submissions")
            .select("id", { count: "exact", head: true })
            .neq("como_conheceu", "importacao")
            .gte("created_at", startOfMonth(prevYear).toISOString())
            .lte("created_at", endOfMonth(prevYear).toISOString()),
        ]);
        leadsEvolution.push({
          mes: format(month, "MMM", { locale: ptBR }),
          atual: atual.count || 0,
          anterior: anterior.count || 0,
        });
      }

      // Process data
      const processosData = processosResult.data || [];
      const processos: ProcessosPorStatus = {
        emAndamento: processosData.filter((p) => p.status === "em_andamento").length,
        concluidos: processosData.filter((p) => p.status === "concluido").length,
        arquivados: processosData.filter((p) => p.status === "arquivado").length,
      };

      const proximosPrazos: PrazoProximo[] = (prazosResult.data || []).map((p) => {
        const diasRestantes = Math.ceil(
          (new Date(p.data_prazo).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          id: p.id,
          processo_id: p.processo_id,
          numero_processo: processosMap[p.processo_id] || null,
          tipo_prazo: p.tipo_prazo,
          descricao: p.descricao,
          data_prazo: p.data_prazo,
          dias_restantes: diasRestantes,
          prioridade: p.prioridade || "media",
        };
      });

      // Pipeline
      const estagioLabels: Record<string, string> = {
        novo: "Novo",
        contato: "Contato",
        analise: "Análise",
        proposta: "Proposta",
      };
      const estagioCount: Record<string, number> = {};
      (leadsResult.data || []).forEach((l) => {
        const e = l.estagio || "novo";
        estagioCount[e] = (estagioCount[e] || 0) + 1;
      });
      const pipeline: PipelineEstagio[] = ["novo", "contato", "analise", "proposta"].map((e) => ({
        estagio: e,
        label: estagioLabels[e] || e,
        count: estagioCount[e] || 0,
      }));

      const leadsRecentes: LeadRecente[] = (leadsRecentesResult.data || []).map((l) => ({
        id: l.id,
        nome_completo: l.nome_completo,
        tipo_processo: l.tipo_processo,
        estagio: l.estagio,
        created_at: l.created_at,
      }));

      // Generate propostas
      const propostas: PropostaAcao[] = [];
      const processosSemAtualizacaoData = processosAtrasadosResult.data || [];
      const processosSemAtualizacao: ProcessoSemAtualizacao[] = processosSemAtualizacaoData.map((p) => {
        const lastUpdate = p.data_ultima_atualizacao ? new Date(p.data_ultima_atualizacao) : null;
        const diasSem = lastUpdate
          ? Math.floor((hoje.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        return {
          id: p.id,
          numero_processo: p.numero_processo,
          tipo: p.tipo,
          autor: p.autor,
          reu: p.reu,
          data_ultima_atualizacao: p.data_ultima_atualizacao,
          dias_sem_atualizacao: diasSem,
        };
      });
      const processosAtrasados = processosSemAtualizacaoData.length;
      const leadsParados = leadsParadosResult.count || 0;
      const demandasAtrasadas = demandasAtrasadasResult.count || 0;

      if (demandasAtrasadas > 0) {
        propostas.push({
          id: "demandas-atrasadas",
          tipo: "tarefa",
          icone: "ClipboardList",
          titulo: `${demandasAtrasadas} tarefa${demandasAtrasadas > 1 ? "s" : ""} atrasada${demandasAtrasadas > 1 ? "s" : ""}`,
          descricao: "Tarefas com prazo vencido precisam de atenção imediata",
          link: "/dashboard/processos/demandas",
          severidade: "error",
        });
      }

      if (proximosPrazos.length > 0) {
        const urgentes = proximosPrazos.filter((p) => p.dias_restantes <= 3);
        if (urgentes.length > 0) {
          propostas.push({
            id: "prazos-urgentes",
            tipo: "prazo",
            icone: "Timer",
            titulo: `${urgentes.length} prazo${urgentes.length > 1 ? "s" : ""} vencendo em até 3 dias`,
            descricao: "Prazos processuais críticos que exigem ação imediata",
            link: "/dashboard/processos/calendario",
            severidade: "error",
          });
        }
      }

      if (processosAtrasados > 0) {
        propostas.push({
          id: "processos-sem-update",
          tipo: "processo",
          icone: "Scale",
          titulo: `${processosAtrasados} processo${processosAtrasados > 1 ? "s" : ""} sem atualização`,
          descricao: "Processos sem movimentação há mais de 30 dias -- verificar andamentos",
          link: "/dashboard/processos",
          severidade: "warning",
        });
      }

      if (leadsParados > 0) {
        propostas.push({
          id: "leads-parados",
          tipo: "vendas",
          icone: "UserX",
          titulo: `${leadsParados} lead${leadsParados > 1 ? "s" : ""} parado${leadsParados > 1 ? "s" : ""}`,
          descricao: "Leads sem atividade há mais de 7 dias -- retomar contato",
          link: "/dashboard/leads",
          severidade: "warning",
        });
      }

      const totalLeadsMes = totalLeadsMesResult.count || 0;
      const convertidosMes = convertidosMesResult.count || 0;
      const taxaConversao =
        totalLeadsMes > 0 ? Math.round((convertidosMes / totalLeadsMes) * 1000) / 10 : 0;

      return {
        processos,
        proximosPrazos,
        pipeline,
        leadsRecentes,
        propostas,
        processosSemAtualizacao,
        totalClientes: totalClientesResult.count || 0,
        totalLeadsMes,
        taxaConversao,
        demandasPendentes: demandasPendentesResult.count || 0,
        leadsEvolution,
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 min
  });
}
