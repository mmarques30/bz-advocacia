import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle } from "lucide-react";

import { DashboardKPIStripV2 } from "@/components/dashboard/DashboardKPIStripV2";
import { DashboardSituacaoTarefasCard } from "@/components/dashboard/DashboardSituacaoTarefasCard";
import { DashboardCargaEquipeCard } from "@/components/dashboard/DashboardCargaEquipeCard";
import { DashboardPrazosCard } from "@/components/dashboard/DashboardPrazosCard";
import { DashboardEvolucaoProcessosV2 } from "@/components/dashboard/DashboardEvolucaoProcessosV2";
import { DashboardPipelineLeadsCard } from "@/components/dashboard/DashboardPipelineLeadsCard";
import { DashboardAniversariantesCard } from "@/components/dashboard/DashboardAniversariantesCard";
import { useDashboardPrincipal } from "@/hooks/useDashboardPrincipal";
import { useDashboardVisual } from "@/hooks/useDashboardVisual";
import { useProcessosEvolucao } from "@/hooks/useProcessosEvolucao";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useCheckIsAdmin } from "@/hooks/useUsuarios";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Dashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data, isLoading } = useDashboardPrincipal();
  const { data: visual, isLoading: visualLoading } = useDashboardVisual();
  const { data: evolucaoData, isLoading: evolucaoLoading } = useProcessosEvolucao();
  const { data: isAdmin } = useCheckIsAdmin();
  const navigate = useNavigate();

  const userName = profile?.nome_completo || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const hoje = new Date();
  const dataFormatada = format(hoje, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

  const loading = isLoading || visualLoading;

  // Alerta crítico
  const tarefasUrgentes = data?.tarefasUrgentes || 0;
  const prazosHoje = data?.prazosHojeCount || 0;
  const alertaCritico =
    tarefasUrgentes > 0
      ? { text: `${tarefasUrgentes} tarefa${tarefasUrgentes > 1 ? "s" : ""} urgente${tarefasUrgentes > 1 ? "s" : ""} precisam de atenção`, isUrgent: true }
      : prazosHoje > 0
      ? { text: `${prazosHoje} prazo${prazosHoje > 1 ? "s" : ""} vence${prazosHoje > 1 ? "m" : ""} hoje`, isUrgent: true }
      : { text: "Escritório operando normalmente", isUrgent: false };

  // KPI cells
  const receitaFormatada = visual?.receitaMes
    ? `R$ ${(visual.receitaMes / 1000).toFixed(1)}k`
    : "R$ 0";

  const kpiCells = [
    {
      title: "Processos ativos",
      value: data?.processosAtivos || 0,
      subtitle: `${data?.processosConcluídosMes || 0} concluídos no mês`,
      accentColor: "#378ADD",
    },
    {
      title: "Tarefas urgentes",
      value: tarefasUrgentes,
      subtitle: `${data?.tarefasAtivas || 0} ativas no total`,
      accentColor: "#A32D2D",
      valueColor: tarefasUrgentes > 0 ? "#A32D2D" : undefined,
    },
    {
      title: "Sem registro",
      value: data?.semRegistro || 0,
      subtitle: "Aguardam movimentação",
      accentColor: "#B8860B",
      valueColor: (data?.semRegistro || 0) > 0 ? "#B8860B" : undefined,
    },
    {
      title: "Leads no mês",
      value: data?.leadsNoMes || 0,
      subtitle: (data?.leadsSemFollowUp || 0) > 0 ? (
        <span style={{ color: "#B8860B" }}>{data?.leadsSemFollowUp} parado{(data?.leadsSemFollowUp || 0) > 1 ? "s" : ""}</span>
      ) : (
        "Todos acompanhados"
      ),
      accentColor: "#3B6D11",
    },
    // Receita visivel apenas para admin — call 16/04: equipe nao deve ver.
    ...(isAdmin ? [{
      title: "Receita do mês",
      value: receitaFormatada,
      subtitle: "Faturamento acumulado",
      accentColor: "#B8860B",
      valueColor: "#3B6D11",
    }] : []),
    {
      title: "Clientes ativos",
      value: data?.clientesAtivos || 0,
      subtitle: `+${data?.clientesNovosMes || 0} este mês`,
      accentColor: "#7C3AED",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Saudação + Alerta */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
        <div>
          <h1 className="text-3xl md:text-4xl font-seasons text-primary">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{dataCapitalizada}</p>
        </div>
        <div className="flex items-center gap-1.5 text-right">
          {alertaCritico.isUrgent ? (
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <p className={`text-sm font-medium ${alertaCritico.isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
            {alertaCritico.text}
          </p>
        </div>
      </div>

      {/* KPI Strip */}
      <DashboardKPIStripV2 cells={kpiCells} loading={loading} />

      {/* Linha 1: 3 cards */}
      <div className="grid gap-5 lg:grid-cols-3">
        <DashboardSituacaoTarefasCard
          data={visual?.tarefas || { urgentes: 0, atrasadas: 0, concluidasSemana: 0, pendentes: 0, totalAtivas: 0 }}
          loading={loading}
        />
        <DashboardCargaEquipeCard data={visual?.heatmap || []} loading={loading} />
        <DashboardPrazosCard
          prazos={visual?.prazos || { atrasados: 0, hoje: 0, estaSemana: 0, dias30: 0 }}
          proximosPrazos={visual?.proximosPrazos || []}
          loading={loading}
        />
      </div>

      {/* Linha 2: 2 cards */}
      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardEvolucaoProcessosV2
          data={evolucaoData?.meses || []}
          loading={evolucaoLoading}
        />
        <DashboardPipelineLeadsCard
          funil={data?.leadsFunil || { novo: 0, em_contato: 0, proposta: 0, perdido: 0 }}
          taxaConversao={data?.taxaConversaoMes || 0}
          leadsParados={data?.leadsSemFollowUpList || []}
          loading={loading}
        />
      </div>

      {/* Aniversariantes */}
      <DashboardAniversariantesCard
        aniversariantes={visual?.aniversariantes || []}
        loading={loading}
      />
    </div>
  );
}
