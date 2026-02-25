import { Users, CalendarDays, Send, UserCheck, TrendingUp, Target } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import type { MarketingCsvAnalytics } from "@/hooks/useMarketingCsvAnalytics";

interface Props {
  analytics: MarketingCsvAnalytics;
}

export function MarketingCsvKPIs({ analytics }: Props) {
  const { totalLeads, leadsHoje, leadsSemana, taxaEnvio, taxaQualificacao, taxaConversao, isLoading } = analytics;

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      <KPICard title="Total Leads" value={totalLeads} icon={Users} loading={isLoading} />
      <KPICard title="Leads Hoje" value={leadsHoje} icon={CalendarDays} loading={isLoading} />
      <KPICard title="Últimos 7 dias" value={leadsSemana} icon={TrendingUp} loading={isLoading} />
      <KPICard title="Taxa Envio" value={taxaEnvio} icon={Send} format="percentage" loading={isLoading} />
      <KPICard title="Qualificação" value={taxaQualificacao} icon={UserCheck} format="percentage" loading={isLoading} />
      <KPICard title="Conversão" value={taxaConversao} icon={Target} format="percentage" loading={isLoading} />
    </div>
  );
}
