import {
  Users,
  TrendingUp,
  Briefcase,
  ClipboardList,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { UserPendenciasCards } from "@/components/dashboard/UserPendenciasCards";
import { VisaoOperacional } from "@/components/dashboard/VisaoOperacional";
import { LeadsEvolution } from "@/components/dashboard/LeadsEvolution";
import { useUserPendencias } from "@/hooks/useUserPendencias";
import { useDashboardCompleto } from "@/hooks/useDashboardCompleto";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Dashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data: pendencias, isLoading: pendenciasLoading } = useUserPendencias();
  const { data: dashboard, isLoading: dashboardLoading } = useDashboardCompleto();

  const userName = profile?.nome_completo || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

  return (
    <div className="space-y-6">
      {/* Saudação */}
      <div>
        <h1 className="text-3xl md:text-4xl font-seasons text-primary">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-base text-muted-foreground mt-1">Aqui está o resumo do seu escritório</p>
      </div>

      {/* Pendências do Usuário */}
      <UserPendenciasCards data={pendencias} loading={pendenciasLoading} />

      {/* KPIs Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard title="Clientes Ativos" value={dashboard?.totalClientes || 0} icon={Users} loading={dashboardLoading} />
        <KPICard title="Leads no Mês" value={dashboard?.totalLeadsMes || 0} icon={TrendingUp} loading={dashboardLoading} />
        <KPICard title="Processos Ativos" value={dashboard?.processos.emAndamento || 0} icon={Briefcase} loading={dashboardLoading} />
        <KPICard title="Tarefas Pendentes" value={dashboard?.demandasPendentes || 0} icon={ClipboardList} loading={dashboardLoading} />
      </div>

      <LeadsEvolution data={dashboard?.leadsEvolution || []} loading={dashboardLoading} />

      <VisaoOperacional
        processos={dashboard?.processos || { emAndamento: 0, concluidos: 0, arquivados: 0 }}
        proximosPrazos={dashboard?.proximosPrazos || []}
        processosSemAtualizacao={dashboard?.processosSemAtualizacao || []}
        loading={dashboardLoading}
      />
    </div>
  );
}
