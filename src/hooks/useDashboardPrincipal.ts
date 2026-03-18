import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// === Interfaces ===

export interface PrazoUrgencia {
  atrasados: number;
  hoje: number;
  estaSemana: number;
  trintaDias: number;
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

export interface TarefaUrgente {
  id: string;
  titulo: string;
  prioridade: string;
  data_limite: string | null;
  advogada_responsavel: string;
  responsavel_nome: string | null;
  status: string;
}

export interface DistribuicaoMembro {
  id: string;
  nome: string;
  iniciais: string;
  processos: number;
  tarefas: number;
  tarefasUrgentes: number;
}

export interface LeadPendente {
  id: string;
  nome: string;
  origem: string | null;
  dias_parado: number;
}

export interface LeadsFunil {
  novo: number;
  em_contato: number;
  proposta: number;
  perdido: number;
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
  // KPI Strip
  processosAtivos: number;
  processosConcluídosMes: number;
  prazosHojeCount: number;
  semRegistro: number;
  tarefasAtivas: number;
  tarefasUrgentes: number;
  leadsNoMes: number;
  leadsSemFollowUp: number;
  clientesAtivos: number;
  clientesNovosMes: number;
  // Line 1
  prazosUrgencia: PrazoUrgencia;
  proximosPrazos: PrazoProximoEnriquecido[];
  tarefasUrgentesList: TarefaUrgente[];
  // Line 2
  distribuicao: DistribuicaoMembro[];
  leadsFunil: LeadsFunil;
  leadsSemFollowUpList: LeadPendente[];
  taxaConversaoMes: number;
  statusProcessos: StatusProcessos;
  processosSemMovimentacao: ProcessoSemMovimentacao[];
  totalSemMovimentacao: number;
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
    queryKey: ["dashboard-principal-v2"],
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

      // Início do mês corrente
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const inicioMesISO = inicioMes.toISOString();

      // 2 dias atrás para follow-up
      const ha2Dias = new Date(hoje);
      ha2Dias.setDate(ha2Dias.getDate() - 2);
      const ha2DiasISO = ha2Dias.toISOString();

      // Batch 1: All independent counts
      const [
        prazosAtrasadosR,
        prazosHojeR,
        prazosSemanaR,
        prazos30DiasR,
        processosR,
        demandasAtivasR,
        demandasUrgentesR,
        leadsNoMesR,
        leadsSemFollowUpCountR,
        clientesAtivosR,
        clientesNovosMesR,
        processosSemMovCountR,
        processosSemMovR,
        proximosPrazosR,
        tarefasUrgentesR,
        leadsSemFollowUpListR,
        leadsPendentesR,
        leadsFechadosMesR,
        leadsTotalMesR,
        semRegistroR,
      ] = await Promise.all([
        // Prazos atrasados
        supabase.from("processos_prazos").select("id", { count: "exact", head: true })
          .eq("status", "pendente").lt("data_prazo", hojeISO),
        // Prazos hoje
        supabase.from("processos_prazos").select("id", { count: "exact", head: true })
          .eq("status", "pendente").eq("data_prazo", hojeISO),
        // Esta semana
        supabase.from("processos_prazos").select("id", { count: "exact", head: true })
          .eq("status", "pendente").gte("data_prazo", hojeISO).lte("data_prazo", fimSemanaISO),
        // 30 dias
        supabase.from("processos_prazos").select("id", { count: "exact", head: true })
          .eq("status", "pendente").gt("data_prazo", fimSemanaISO).lte("data_prazo", em30DiasISO),
        // Processos (all for status + distribution)
        supabase.from("processos").select("id, status, responsavel_id, data_ultima_atualizacao"),
        // Demandas ativas
        supabase.from("demandas_internas").select("id", { count: "exact", head: true })
          .not("status", "in", "(concluido,cancelado)"),
        // Demandas urgentes
        supabase.from("demandas_internas").select("id", { count: "exact", head: true })
          .not("status", "in", "(concluido,cancelado)").eq("prioridade", "urgente"),
        // Leads no mês
        supabase.from("contact_submissions").select("id", { count: "exact", head: true })
          .gte("created_at", inicioMesISO),
        // Leads sem follow-up (> 2 dias)
        supabase.from("contact_submissions").select("id", { count: "exact", head: true })
          .not("estagio", "eq", "fechado").lt("ultimo_contato_em", ha2DiasISO),
        // Clientes ativos (estagio = fechado)
        supabase.from("contact_submissions").select("id", { count: "exact", head: true })
          .eq("estagio", "fechado"),
        // Clientes novos este mês (estagio = fechado criados no mês)
        supabase.from("contact_submissions").select("id", { count: "exact", head: true })
          .eq("estagio", "fechado").gte("created_at", inicioMesISO),
        // Processos sem movimentação (count)
        supabase.from("processos").select("id", { count: "exact", head: true })
          .eq("status", "em_andamento")
          .or(`data_ultima_atualizacao.lt.${ha30Dias.toISOString()},data_ultima_atualizacao.is.null`),
        // Processos sem movimentação (top 3)
        supabase.from("processos").select("id, numero_processo, autor, reu, data_ultima_atualizacao")
          .eq("status", "em_andamento")
          .or(`data_ultima_atualizacao.lt.${ha30Dias.toISOString()},data_ultima_atualizacao.is.null`)
          .order("data_ultima_atualizacao", { ascending: true, nullsFirst: true }).limit(3),
        // Próximos prazos (8)
        supabase.from("processos_prazos")
          .select("id, processo_id, tipo_prazo, descricao, data_prazo, prioridade, responsavel_id")
          .eq("status", "pendente").gte("data_prazo", hojeISO)
          .order("data_prazo", { ascending: true }).limit(8),
        // Tarefas urgentes/alta (top 8)
        supabase.from("demandas_internas")
          .select("id, titulo, prioridade, data_limite, advogada_responsavel, responsavel_id, status")
          .not("status", "in", "(concluido,cancelado)")
          .in("prioridade", ["urgente", "alta"])
          .order("data_limite", { ascending: true, nullsFirst: false }).limit(8),
        // Leads sem follow-up list (top 5)
        supabase.from("contact_submissions")
          .select("id, nome_completo, origem, ultimo_contato_em")
          .not("estagio", "eq", "fechado")
          .lt("ultimo_contato_em", ha2DiasISO)
          .order("ultimo_contato_em", { ascending: true }).limit(5),
        // Leads pendentes por estágio
        supabase.from("contact_submissions")
          .select("estagio")
          .not("estagio", "eq", "fechado"),
        // Leads fechados no mês (conversão)
        supabase.from("contact_submissions").select("id", { count: "exact", head: true })
          .eq("estagio", "fechado").gte("created_at", inicioMesISO),
        // Leads total no mês
        supabase.from("contact_submissions").select("id", { count: "exact", head: true })
          .gte("created_at", inicioMesISO),
        // Processos sem registro (sem nenhum histórico)
        supabase.rpc("count_processos_sem_historico" as never).then(r => r).catch(() => ({ count: 0, data: null, error: null })),
      ]);

      // === Process data ===
      const processosData = processosR.data || [];
      const statusProcessos: StatusProcessos = {
        emAndamento: processosData.filter(p => p.status === "em_andamento").length,
        concluidos: processosData.filter(p => p.status === "concluido").length,
        arquivados: processosData.filter(p => p.status === "arquivado").length,
      };

      // Processos concluídos no mês
      const processosConcluídosMes = processosData.filter(p => {
        if (p.status !== "concluido") return false;
        const upd = p.data_ultima_atualizacao ? new Date(p.data_ultima_atualizacao) : null;
        return upd && upd >= inicioMes;
      }).length;

      // Sem registro: count processos em_andamento sem histórico
      // We'll approximate: processos without data_ultima_atualizacao that are em_andamento
      const semRegistroCount = processosData.filter(p => 
        p.status === "em_andamento" && !p.data_ultima_atualizacao
      ).length;

      // === Distribution by responsável ===
      const processosEmAndamento = processosData.filter(p => p.status === "em_andamento");
      const respProcessos: Record<string, number> = {};
      processosEmAndamento.forEach(p => {
        if (p.responsavel_id) respProcessos[p.responsavel_id] = (respProcessos[p.responsavel_id] || 0) + 1;
      });

      // Get demandas for distribution
      const { data: demandasDistrib } = await supabase.from("demandas_internas")
        .select("responsavel_id, prioridade")
        .not("status", "in", "(concluido,cancelado)");

      const respTarefas: Record<string, number> = {};
      const respTarefasUrg: Record<string, number> = {};
      (demandasDistrib || []).forEach(d => {
        if (d.responsavel_id) {
          respTarefas[d.responsavel_id] = (respTarefas[d.responsavel_id] || 0) + 1;
          if (d.prioridade === "urgente") respTarefasUrg[d.responsavel_id] = (respTarefasUrg[d.responsavel_id] || 0) + 1;
        }
      });

      const allRespIds = [...new Set([
        ...Object.keys(respProcessos),
        ...Object.keys(respTarefas),
      ])];

      // Get profiles for all responsible IDs + tarefa responsaveis
      const tarefaRespIds = [...new Set((tarefasUrgentesR.data || []).map(t => t.responsavel_id).filter(Boolean))] as string[];
      const prazoRespIds = [...new Set((proximosPrazosR.data || []).map(p => p.responsavel_id).filter(Boolean))] as string[];
      const allProfileIds = [...new Set([...allRespIds, ...tarefaRespIds, ...prazoRespIds])];

      let profilesMap: Record<string, string> = {};
      if (allProfileIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, nome_completo").in("id", allProfileIds);
        (profiles || []).forEach(p => { profilesMap[p.id] = p.nome_completo; });
      }

      const distribuicao: DistribuicaoMembro[] = allRespIds.map(id => {
        const nome = profilesMap[id] || "Sem nome";
        const partes = nome.split(" ");
        const iniciais = partes.length >= 2
          ? (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
          : nome.substring(0, 2).toUpperCase();
        return {
          id,
          nome,
          iniciais,
          processos: respProcessos[id] || 0,
          tarefas: respTarefas[id] || 0,
          tarefasUrgentes: respTarefasUrg[id] || 0,
        };
      }).sort((a, b) => (b.processos + b.tarefas) - (a.processos + a.tarefas));

      // === Enrich próximos prazos ===
      const prazoData = proximosPrazosR.data || [];
      const processoIds = [...new Set(prazoData.map(p => p.processo_id))];

      let processosMap: Record<string, { numero_processo: string | null; lead_id: string | null; responsavel_id: string | null }> = {};
      if (processoIds.length > 0) {
        const { data } = await supabase.from("processos").select("id, numero_processo, lead_id, responsavel_id").in("id", processoIds);
        (data || []).forEach(p => { processosMap[p.id] = { numero_processo: p.numero_processo, lead_id: p.lead_id, responsavel_id: p.responsavel_id }; });
      }

      const leadIds = [...new Set(Object.values(processosMap).map(p => p.lead_id).filter(Boolean))] as string[];
      let clientesMap: Record<string, string> = {};
      if (leadIds.length > 0) {
        const { data } = await supabase.from("contact_submissions").select("id, nome_completo").in("id", leadIds);
        (data || []).forEach(c => { clientesMap[c.id] = c.nome_completo; });
      }

      const proximosPrazos: PrazoProximoEnriquecido[] = prazoData.map(p => {
        const proc = processosMap[p.processo_id];
        const diasRestantes = Math.ceil((new Date(p.data_prazo).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
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
          advogada_nome: advId ? profilesMap[advId] || null : null,
        };
      });

      // === Tarefas urgentes enriquecidas ===
      const tarefasUrgentesList: TarefaUrgente[] = (tarefasUrgentesR.data || []).map(t => ({
        id: t.id,
        titulo: t.titulo,
        prioridade: t.prioridade,
        data_limite: t.data_limite,
        advogada_responsavel: t.advogada_responsavel,
        responsavel_nome: t.responsavel_id ? profilesMap[t.responsavel_id] || null : null,
        status: t.status,
      }));

      // === Leads funil ===
      const leadsPendentes = leadsPendentesR.data || [];
      const leadsFunil: LeadsFunil = { novo: 0, em_contato: 0, proposta: 0, perdido: 0 };
      leadsPendentes.forEach(l => {
        const e = l.estagio || "novo";
        if (e === "novo") leadsFunil.novo++;
        else if (e === "em_contato" || e === "contato") leadsFunil.em_contato++;
        else if (e === "proposta" || e === "proposta_enviada") leadsFunil.proposta++;
        else if (e === "perdido") leadsFunil.perdido++;
      });

      // === Leads sem follow-up list ===
      const leadsSemFollowUpList: LeadPendente[] = (leadsSemFollowUpListR.data || []).map(l => {
        const lastContact = l.ultimo_contato_em ? new Date(l.ultimo_contato_em) : null;
        const diasParado = lastContact
          ? Math.floor((hoje.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        return {
          id: l.id,
          nome: l.nome_completo,
          origem: l.origem,
          dias_parado: diasParado,
        };
      });

      // === Taxa conversão ===
      const fechadosMes = leadsFechadosMesR.count || 0;
      const totalMes = leadsTotalMesR.count || 0;
      const taxaConversaoMes = totalMes > 0 ? Math.round((fechadosMes / totalMes) * 100) : 0;

      // === Processos sem movimentação ===
      const processosSemMovimentacao: ProcessoSemMovimentacao[] = (processosSemMovR.data || []).map(p => {
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
        processosAtivos: statusProcessos.emAndamento,
        processosConcluídosMes: processosConcluídosMes,
        prazosHojeCount: prazosHojeR.count || 0,
        semRegistro: semRegistroCount,
        tarefasAtivas: demandasAtivasR.count || 0,
        tarefasUrgentes: demandasUrgentesR.count || 0,
        leadsNoMes: leadsNoMesR.count || 0,
        leadsSemFollowUp: leadsSemFollowUpCountR.count || 0,
        clientesAtivos: clientesAtivosR.count || 0,
        clientesNovosMes: clientesNovosMesR.count || 0,
        prazosUrgencia: {
          atrasados: prazosAtrasadosR.count || 0,
          hoje: prazosHojeR.count || 0,
          estaSemana: prazosSemanaR.count || 0,
          trintaDias: prazos30DiasR.count || 0,
        },
        proximosPrazos,
        tarefasUrgentesList,
        distribuicao,
        leadsFunil,
        leadsSemFollowUpList,
        taxaConversaoMes,
        statusProcessos,
        processosSemMovimentacao,
        totalSemMovimentacao: processosSemMovCountR.count || 0,
      };
    },
    refetchInterval: 5 * 60 * 1000,
  });
}
