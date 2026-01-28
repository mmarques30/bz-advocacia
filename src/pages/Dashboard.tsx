import { Users, TrendingUp, UserPlus, Briefcase, Calendar } from "lucide-react";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { KPICard } from "@/components/dashboard/KPICard";
import { LeadsEvolution } from "@/components/dashboard/LeadsEvolution";
import { UserPendenciasCards } from "@/components/dashboard/UserPendenciasCards";
import { useDateFilter } from "@/hooks/useDateFilter";
import { useUserPendencias } from "@/hooks/useUserPendencias";
import {
  useKPIs,
  useLeadsEvolution,
} from "@/hooks/useDashboardData";

export default function Dashboard() {
  const { filters, setPreset, clearFilters } = useDateFilter();

  const { data: pendencias, isLoading: pendenciasLoading } = useUserPendencias();
  const { data: kpis, isLoading: kpisLoading } = useKPIs(filters);
  const { data: leadsData, isLoading: leadsLoading } = useLeadsEvolution(filters);

  return (
    <div className="space-y-6">
      <DashboardFilters
        periodo={filters.periodo}
        onPeriodoChange={setPreset}
        onClearFilters={clearFilters}
      />

      {/* Pendências do Usuário */}
      <UserPendenciasCards data={pendencias} loading={pendenciasLoading} />

      {/* KPIs Grid - 5 colunas responsivo */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <KPICard
          title="Total de Leads"
          value={kpis?.totalLeads || 0}
          icon={Users}
          loading={kpisLoading}
        />
        <KPICard
          title="Taxa de Conversão"
          value={kpis?.taxaConversao || 0}
          icon={TrendingUp}
          format="percentage"
          loading={kpisLoading}
        />
        <KPICard
          title="Novos Clientes"
          value={kpis?.novosClientes || 0}
          icon={UserPlus}
          loading={kpisLoading}
        />
        <KPICard
          title="Processos Ativos"
          value={kpis?.processosAtivos || 0}
          icon={Briefcase}
          loading={kpisLoading}
        />
        <KPICard
          title="Prazos Próximos"
          value={kpis?.prazosProximos || 0}
          icon={Calendar}
          loading={kpisLoading}
        />
      </div>

      {/* Leads Evolution Chart - Full Width */}
      <LeadsEvolution data={leadsData || []} loading={leadsLoading} />
    </div>
  );
}
