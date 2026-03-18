import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DashboardKPIStrip } from "@/components/dashboard/DashboardKPIStrip";
import { DashboardPrazosCard } from "@/components/dashboard/DashboardPrazosCard";
import { DashboardTarefasUrgentesCard } from "@/components/dashboard/DashboardTarefasUrgentesCard";
import { DashboardDistribuicaoCard } from "@/components/dashboard/DashboardDistribuicaoCard";
import { DashboardLeadsPendentesCard } from "@/components/dashboard/DashboardLeadsPendentesCard";
import { ProcessoDetailsDialog } from "@/components/processos/ProcessoDetailsDialog";
import { DemandaDetailsDialog } from "@/components/demandas/DemandaDetailsDialog";
import { useDashboardPrincipal, type TarefaUrgente } from "@/hooks/useDashboardPrincipal";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import type { Demanda } from "@/types/demandas";

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
  const [selectedProcessoId, setSelectedProcessoId] = useState<string | null>(null);
  const [selectedDemanda, setSelectedDemanda] = useState<Demanda | null>(null);

  const userName = profile?.nome_completo || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const hoje = new Date();
  const dataFormatada = format(hoje, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

  const prazosHoje = data?.prazosHojeCount || 0;

  // Build KPI cells
  const kpiCells = [
    {
      title: "Processos ativos",
      value: data?.processosAtivos || 0,
      context: `${data?.processosConcluídosMes || 0} concluídos no mês`,
      contextColor: "muted" as const,
    },
    {
      title: "Prazos hoje",
      value: prazosHoje,
      context: prazosHoje > 0 ? `${prazosHoje} vencendo` : "Nenhum vencendo",
      contextColor: prazosHoje > 0 ? "destructive" as const : "green" as const,
    },
    {
      title: "Sem registro",
      value: data?.semRegistro || 0,
      context: "Aguardam movimentação",
      contextColor: "amber" as const,
    },
    {
      title: "Tarefas ativas",
      value: data?.tarefasAtivas || 0,
      context: `${data?.tarefasUrgentes || 0} urgentes`,
      contextColor: (data?.tarefasUrgentes || 0) > 0 ? "destructive" as const : "muted" as const,
    },
    {
      title: "Leads no mês",
      value: data?.leadsNoMes || 0,
      context: `${data?.leadsSemFollowUp || 0} sem follow-up`,
      contextColor: (data?.leadsSemFollowUp || 0) > 0 ? "amber" as const : "muted" as const,
    },
    {
      title: "Clientes ativos",
      value: data?.clientesAtivos || 0,
      context: `+${data?.clientesNovosMes || 0} este mês`,
      contextColor: "green" as const,
    },
  ];

  const handleTarefaClick = (tarefa: TarefaUrgente) => {
    setSelectedDemanda({
      id: tarefa.id,
      titulo: tarefa.titulo,
      prioridade: tarefa.prioridade as Demanda["prioridade"],
      status: tarefa.status as Demanda["status"],
      advogada_responsavel: tarefa.advogada_responsavel as Demanda["advogada_responsavel"],
      data_limite: tarefa.data_limite,
      descricao: null,
      tipo: "tarefa",
      categoria: "geral",
      criado_por: null,
      responsavel_id: null,
      processo_id: null,
      lead_id: null,
      data_conclusao: null,
      concluida_em: null,
      parent_id: null,
      ordem: null,
      created_at: "",
      updated_at: "",
    });
  };

  return (
    <div className="space-y-5">
      {/* Saudação + Data */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
        <div>
          <h1 className="text-3xl md:text-4xl font-seasons text-primary">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-base text-muted-foreground mt-1">Aqui está o resumo operacional do escritório</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{dataCapitalizada}</p>
          <p className="text-xs text-muted-foreground">
            {prazosHoje > 0
              ? `${prazosHoje} prazo${prazosHoje > 1 ? "s" : ""} vence${prazosHoje > 1 ? "m" : ""} hoje`
              : "Nenhum prazo vencendo hoje"}
          </p>
        </div>
      </div>

      {/* KPI Strip */}
      <DashboardKPIStrip cells={kpiCells} loading={isLoading} />

      {/* Line 1 — Prazos + Tarefas urgentes */}
      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardPrazosCard
          urgencia={data?.prazosUrgencia || { atrasados: 0, hoje: 0, estaSemana: 0, trintaDias: 0 }}
          proximosPrazos={data?.proximosPrazos || []}
          loading={isLoading}
          onPrazoClick={(id) => setSelectedProcessoId(id)}
        />
        <DashboardTarefasUrgentesCard
          tarefas={data?.tarefasUrgentesList || []}
          loading={isLoading}
          onTarefaClick={handleTarefaClick}
        />
      </div>

      {/* Line 2 — Distribuição + Leads + Status */}
      <div className="grid gap-5 lg:grid-cols-3">
        <DashboardDistribuicaoCard
          membros={data?.distribuicao || []}
          loading={isLoading}
        />
        <DashboardLeadsPendentesCard
          funil={data?.leadsFunil || { novo: 0, em_contato: 0, proposta: 0, perdido: 0 }}
          semFollowUp={data?.leadsSemFollowUpList || []}
          taxaConversao={data?.taxaConversaoMes || 0}
          loading={isLoading}
        />
        <DashboardStatusProcessosCard
          statusProcessos={data?.statusProcessos || { emAndamento: 0, concluidos: 0, arquivados: 0 }}
          processosSemMov={data?.processosSemMovimentacao || []}
          totalSemMov={data?.totalSemMovimentacao || 0}
          loading={isLoading}
          onProcessoClick={(id) => setSelectedProcessoId(id)}
        />
      </div>

      {/* Dialogs */}
      <ProcessoDetailsDialog
        processoId={selectedProcessoId}
        open={!!selectedProcessoId}
        onClose={() => setSelectedProcessoId(null)}
      />
      <DemandaDetailsDialog
        demanda={selectedDemanda}
        open={!!selectedDemanda}
        onOpenChange={(open) => { if (!open) setSelectedDemanda(null); }}
        isEditing={false}
        isAdmin={false}
      />
    </div>
  );
}
