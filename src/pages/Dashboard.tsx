import {
  Users,
  TrendingUp,
  Briefcase,
  ClipboardList,
  Calendar,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { UserPendenciasCards } from "@/components/dashboard/UserPendenciasCards";
import { VisaoOperacional } from "@/components/dashboard/VisaoOperacional";
import { PropostasInteligentes } from "@/components/dashboard/PropostasInteligentes";
import { LeadsEvolution } from "@/components/dashboard/LeadsEvolution";
import { useUserPendencias } from "@/hooks/useUserPendencias";
import { useDashboardCompleto } from "@/hooks/useDashboardCompleto";

export default function Dashboard() {
  const { data: pendencias, isLoading: pendenciasLoading } = useUserPendencias();
  const { data: dashboard, isLoading: dashboardLoading } = useDashboardCompleto();

  return (
    <div className="space-y-6">
      {/* Pendências do Usuário */}
      <UserPendenciasCards data={pendencias} loading={pendenciasLoading} />

      {/* KPIs Grid - 4 colunas operacionais (sem valores financeiros) */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Clientes Ativos"
          value={dashboard?.totalClientes || 0}
          icon={Users}
          loading={dashboardLoading}
        />
        <KPICard
          title="Leads no Mês"
          value={dashboard?.totalLeadsMes || 0}
          icon={TrendingUp}
          loading={dashboardLoading}
        />
        <KPICard
          title="Processos Ativos"
          value={dashboard?.processos.emAndamento || 0}
          icon={Briefcase}
          loading={dashboardLoading}
        />
        <KPICard
          title="Tarefas Pendentes"
          value={dashboard?.demandasPendentes || 0}
          icon={ClipboardList}
          loading={dashboardLoading}
        />
      </div>

      {/* Sugestões de Ação */}
      <PropostasInteligentes
        propostas={dashboard?.propostas || []}
        loading={dashboardLoading}
      />

      {/* Visão Operacional: Processos + Pipeline */}
      <VisaoOperacional
        processos={dashboard?.processos || { emAndamento: 0, concluidos: 0, arquivados: 0 }}
        proximosPrazos={dashboard?.proximosPrazos || []}
        processosSemAtualizacao={dashboard?.processosSemAtualizacao || []}
        pipeline={dashboard?.pipeline || []}
        leadsRecentes={dashboard?.leadsRecentes || []}
        loading={dashboardLoading}
      />

      {/* Evolução de Leads */}
      <LeadsEvolution data={dashboard?.leadsEvolution || []} loading={dashboardLoading} />
    </div>
  );
}
