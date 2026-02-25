import { Users, CalendarDays, Send, UserCheck, TrendingUp, Target } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import type { MarketingCsvAnalytics } from "@/hooks/useMarketingCsvAnalytics";

interface Props {
  analytics: MarketingCsvAnalytics;
}

export function MarketingCsvKPIs({ analytics }: Props) {
  const { totalLeads, leadsHoje, leadsSemana, taxaEnvio, taxaQualificacao, taxaConversao, platformKPIs, isLoading } = analytics;

  // Find top platform
  const topPlatform = platformKPIs.length > 0 ? platformKPIs[0] : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <KPICard title="Total Leads" value={totalLeads} icon={Users} loading={isLoading} />
        <KPICard title="Leads Hoje" value={leadsHoje} icon={CalendarDays} loading={isLoading} />
        <KPICard title="Últimos 7 dias" value={leadsSemana} icon={TrendingUp} loading={isLoading} />
        <KPICard title="Taxa Envio" value={taxaEnvio} icon={Send} format="percentage" loading={isLoading} />
        <KPICard title="Qualificação" value={taxaQualificacao} icon={UserCheck} format="percentage" loading={isLoading} />
        <KPICard title="Conversão" value={taxaConversao} icon={Target} format="percentage" loading={isLoading} />
      </div>

      {/* Platform breakdown cards */}
      {platformKPIs.length > 0 && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {platformKPIs.map((p) => (
            <div key={p.key} className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">{p.label}</p>
              <p className="text-2xl font-bold">{p.count}</p>
              <p className="text-xs text-muted-foreground">{p.percentage}% do total</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
