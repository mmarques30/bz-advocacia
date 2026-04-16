import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, format, addDays, endOfMonth } from "date-fns";

export interface TarefaBreakdown {
  urgentes: number;
  atrasadas: number;
  concluidasSemana: number;
  pendentes: number;
  totalAtivas: number;
}

export interface HeatmapRow {
  id: string;
  nome: string;
  iniciais: string;
  urgente: number;
  alta: number;
  media: number;
  baixa: number;
  total: number;
}

export interface PrazosBreakdown {
  atrasados: number;
  hoje: number;
  estaSemana: number;
  dias30: number;
}

export interface ProximoPrazo {
  id: string;
  descricao: string;
  data_prazo: string;
  processo_id: string;
  cliente_nome: string | null;
  dias_restantes: number;
}

export interface Aniversariante {
  id: string;
  nome: string;
  data_nascimento: string;
  dia: number;
  telefone: string;
  isHoje: boolean;
  diasAte: number;
}

export interface DashboardVisualData {
  receitaMes: number;
  tarefas: TarefaBreakdown;
  heatmap: HeatmapRow[];
  prazos: PrazosBreakdown;
  proximosPrazos: ProximoPrazo[];
  aniversariantes: Aniversariante[];
}

export function useDashboardVisual() {
  return useQuery({
    queryKey: ["dashboard-visual"],
    queryFn: async (): Promise<DashboardVisualData> => {
      const hoje = new Date();
      const hojeISO = format(hoje, "yyyy-MM-dd");
      const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
      const inicioSemanaISO = inicioSemana.toISOString();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const inicioMesISO = format(inicioMes, "yyyy-MM-dd");
      const fimMesISO = format(endOfMonth(hoje), "yyyy-MM-dd");
      const fimSemanaISO = format(addDays(inicioSemana, 6), "yyyy-MM-dd");
      const em30DiasISO = format(addDays(hoje, 30), "yyyy-MM-dd");

      const [
        receitaR,
        demandasR,
        concluidasSemanaR,
        prazosR,
        proximosPrazosR,
        clientesR,
        profilesR,
      ] = await Promise.all([
        // Receita do mês
        supabase
          .from("transacoes_financeiras")
          .select("valor")
          .eq("tipo_codigo", "receita")
          .gte("data_transacao", inicioMesISO)
          .lte("data_transacao", fimMesISO),
        // All active demandas for heatmap + breakdown
        supabase
          .from("demandas_internas")
          .select("id, prioridade, status, data_limite, advogada_responsavel, responsavel_id")
          .not("status", "in", "(concluido,cancelado)"),
        // Concluídas na semana
        supabase
          .from("demandas_internas")
          .select("id", { count: "exact", head: true })
          .eq("status", "concluido")
          .gte("concluida_em", inicioSemanaISO),
        // All pending prazos for breakdown.
        // Inclui status IS NULL para registros antigos que podem nao ter
        // o campo preenchido (CHECK constraint permite NULL). Sem isso, o
        // card de "Prazos processuais" pode ficar zerado mesmo com dados.
        supabase
          .from("processos_prazos")
          .select("id, data_prazo, status")
          .or("status.eq.pendente,status.is.null"),
        // Próximos 3 prazos with processo info
        supabase
          .from("processos_prazos")
          .select("id, descricao, data_prazo, processo_id")
          .or("status.eq.pendente,status.is.null")
          .gte("data_prazo", hojeISO)
          .order("data_prazo", { ascending: true })
          .limit(3),
        // Aniversariantes (clientes ativos com data_nascimento)
        supabase
          .from("contact_submissions")
          .select("id, nome_completo, data_nascimento, telefone")
          .eq("estagio", "fechado")
          .not("data_nascimento", "is", null),
        // Profiles for heatmap
        supabase
          .from("profiles")
          .select("id, nome_completo")
          .eq("ativo", true),
      ]);

      // Receita
      const receitaMes = (receitaR.data || []).reduce(
        (sum, r) => sum + Number(r.valor || 0),
        0
      );

      // Tarefas breakdown
      const demandas = demandasR.data || [];
      const urgentes = demandas.filter((d) => d.prioridade === "urgente").length;
      const atrasadas = demandas.filter(
        (d) => d.data_limite && d.data_limite < hojeISO
      ).length;
      const pendentes = demandas.filter((d) => d.status === "pendente").length;
      const concluidasSemana = concluidasSemanaR.count || 0;
      const totalAtivas = demandas.length;

      // Heatmap
      const profiles = profilesR.data || [];
      const profileMap = new Map(profiles.map((p) => [p.id, p.nome_completo]));

      const heatmapData = new Map<
        string,
        { nome: string; urgente: number; alta: number; media: number; baixa: number }
      >();

      for (const d of demandas) {
        const rid = d.responsavel_id;
        if (!rid) continue;
        const nome = profileMap.get(rid) || "Sem nome";
        if (!heatmapData.has(rid)) {
          heatmapData.set(rid, { nome, urgente: 0, alta: 0, media: 0, baixa: 0 });
        }
        const row = heatmapData.get(rid)!;
        const p = d.prioridade || "media";
        if (p === "urgente") row.urgente++;
        else if (p === "alta") row.alta++;
        else if (p === "media") row.media++;
        else row.baixa++;
      }

      const heatmap: HeatmapRow[] = Array.from(heatmapData.entries()).map(
        ([id, row]) => {
          const partes = row.nome.split(" ");
          const iniciais =
            partes.length >= 2
              ? (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
              : row.nome.substring(0, 2).toUpperCase();
          return {
            id,
            nome: row.nome,
            iniciais,
            ...row,
            total: row.urgente + row.alta + row.media + row.baixa,
          };
        }
      ).sort((a, b) => b.total - a.total);

      // Prazos breakdown
      if (prazosR.error) {
        console.warn("[dashboard-visual] Erro ao buscar prazos:", prazosR.error);
      }
      const allPrazos = prazosR.data || [];
      const prazosBreakdown: PrazosBreakdown = { atrasados: 0, hoje: 0, estaSemana: 0, dias30: 0 };
      for (const p of allPrazos) {
        if (!p.data_prazo) continue;
        if (p.data_prazo < hojeISO) prazosBreakdown.atrasados++;
        else if (p.data_prazo === hojeISO) prazosBreakdown.hoje++;
        else if (p.data_prazo <= fimSemanaISO) prazosBreakdown.estaSemana++;
        else if (p.data_prazo <= em30DiasISO) prazosBreakdown.dias30++;
      }

      // Próximos prazos com nome do cliente
      let proximosPrazos: ProximoPrazo[] = [];
      const prazosData = proximosPrazosR.data || [];
      if (prazosData.length > 0) {
        const processoIds = [...new Set(prazosData.map((p) => p.processo_id))];
        const { data: processosData } = await supabase
          .from("processos")
          .select("id, lead_id")
          .in("id", processoIds);

        const leadIds = [
          ...new Set((processosData || []).map((p) => p.lead_id).filter(Boolean)),
        ] as string[];
        let leadMap = new Map<string, string>();
        if (leadIds.length > 0) {
          const { data: leadsData } = await supabase
            .from("contact_submissions")
            .select("id, nome_completo")
            .in("id", leadIds);
          leadMap = new Map(
            (leadsData || []).map((l) => [l.id, l.nome_completo])
          );
        }
        const processoLeadMap = new Map(
          (processosData || []).map((p) => [p.id, p.lead_id])
        );

        proximosPrazos = prazosData.map((p) => {
          const leadId = processoLeadMap.get(p.processo_id);
          const diasRestantes = Math.max(
            0,
            Math.ceil(
              (new Date(p.data_prazo).getTime() - hoje.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          );
          return {
            id: p.id,
            descricao: p.descricao,
            data_prazo: p.data_prazo,
            processo_id: p.processo_id,
            cliente_nome: leadId ? leadMap.get(leadId) || null : null,
            dias_restantes: diasRestantes,
          };
        });
      }

      // Aniversariantes do mês
      const mesAtual = hoje.getMonth() + 1;
      const diaAtual = hoje.getDate();
      const aniversariantes: Aniversariante[] = (clientesR.data || [])
        .filter((c) => {
          if (!c.data_nascimento) return false;
          const [, m] = c.data_nascimento.split("-").map(Number);
          return m === mesAtual;
        })
        .map((c) => {
          const [, , d] = c.data_nascimento!.split("-").map(Number);
          const isHoje = d === diaAtual;
          const diasAte = d >= diaAtual ? d - diaAtual : 999;
          return {
            id: c.id,
            nome: c.nome_completo,
            data_nascimento: c.data_nascimento!,
            dia: d,
            telefone: c.telefone,
            isHoje,
            diasAte,
          };
        })
        .sort((a, b) => a.dia - b.dia);

      return {
        receitaMes,
        tarefas: { urgentes, atrasadas, concluidasSemana, pendentes, totalAtivas },
        heatmap,
        prazos: prazosBreakdown,
        proximosPrazos,
        aniversariantes,
      };
    },
    refetchInterval: 5 * 60 * 1000,
  });
}
