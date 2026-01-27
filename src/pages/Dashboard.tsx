import { Users, TrendingUp, UserPlus, Briefcase, DollarSign, AlertTriangle } from "lucide-react";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { KPICard } from "@/components/dashboard/KPICard";
import { LeadsEvolution } from "@/components/dashboard/LeadsEvolution";
import { AlertsWidget } from "@/components/dashboard/AlertsWidget";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { UserPendenciasCards } from "@/components/dashboard/UserPendenciasCards";
import { useDateFilter } from "@/hooks/useDateFilter";
import { useUserPendencias } from "@/hooks/useUserPendencias";
import {
  useKPIs,
  useLeadsEvolution,
  useAlerts,
  useRecentActivities,
} from "@/hooks/useDashboardData";

export default function Dashboard() {
  const { filters, setPreset, clearFilters } = useDateFilter();

  const { data: pendencias, isLoading: pendenciasLoading } = useUserPendencias();
  const { data: kpis, isLoading: kpisLoading } = useKPIs(filters);
  const { data: leadsData, isLoading: leadsLoading } = useLeadsEvolution(filters);
  const { data: alerts, isLoading: alertsLoading } = useAlerts(filters);
  const { data: activities, isLoading: activitiesLoading } = useRecentActivities(10);

  return (
    <div className="space-y-6">
      <DashboardFilters
        periodo={filters.periodo}
        onPeriodoChange={setPreset}
        onClearFilters={clearFilters}
      />

      {/* Pendências do Usuário */}
      <UserPendenciasCards data={pendencias} loading={pendenciasLoading} />

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Total de Leads"
          value={kpis?.totalLeads || 0}
          icon={Users}
          trend={12.5}
          loading={kpisLoading}
        />
        <KPICard
          title="Taxa de Conversão"
          value={kpis?.taxaConversao || 0}
          icon={TrendingUp}
          format="percentage"
          trend={5.2}
          loading={kpisLoading}
        />
        <KPICard
          title="Novos Clientes"
          value={kpis?.novosClientes || 0}
          icon={UserPlus}
          trend={8.3}
          loading={kpisLoading}
        />
        <KPICard
          title="Processos Ativos"
          value={kpis?.processosAtivos || 0}
          icon={Briefcase}
          trend={-2.1}
          loading={kpisLoading}
        />
        <KPICard
          title="Receita do Mês"
          value={kpis?.receitaMes || 0}
          icon={DollarSign}
          format="currency"
          trend={15.7}
          loading={kpisLoading}
        />
        <KPICard
          title="Taxa de Inadimplência"
          value={kpis?.taxaInadimplencia || 0}
          icon={AlertTriangle}
          format="percentage"
          trend={-1.2}
          loading={kpisLoading}
        />
      </div>


      {/* Leads Evolution Chart - Full Width */}
      <LeadsEvolution data={leadsData || []} loading={leadsLoading} />

      {/* Widgets Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AlertsWidget data={alerts || []} loading={alertsLoading} />
        <RecentActivities data={activities || []} loading={activitiesLoading} />
      </div>
    </div>
  );
}
