import { Card } from "@/components/ui/card";
import { MarketingCsvAnalytics } from "@/hooks/useMarketingCsvAnalytics";
import { Users, CalendarDays, Target, UserCheck, Send, TrendingUp, BarChart3, LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
}

function KPICard({ title, value, subtitle, icon: Icon }: KPICardProps) {
  return (
    <Card className="border rounded-xl bg-card p-6">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </Card>
  );
}

interface Props {
  analytics: MarketingCsvAnalytics;
}

export function MarketingDashboardKPIs({ analytics }: Props) {
  const topPlatform = analytics.platformKPIs[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Leads"
          value={String(analytics.totalLeads)}
          subtitle={`${analytics.leadsSemana} na última semana`}
          icon={Users}
        />
        <KPICard
          title="Leads Hoje"
          value={String(analytics.leadsHoje)}
          subtitle="Captados hoje"
          icon={CalendarDays}
        />
        <KPICard
          title="Taxa de Conversão"
          value={`${analytics.taxaConversao}%`}
          subtitle="Leads convertidos"
          icon={Target}
        />
        <KPICard
          title="Taxa Qualificação"
          value={`${analytics.taxaQualificacao}%`}
          subtitle="Leads qualificados"
          icon={UserCheck}
        />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Taxa de Envio"
          value={`${analytics.taxaEnvio}%`}
          subtitle="Leads com contato enviado"
          icon={Send}
        />
        <KPICard
          title="Leads na Semana"
          value={String(analytics.leadsSemana)}
          subtitle="Últimos 7 dias"
          icon={TrendingUp}
        />
        <KPICard
          title="Plataforma Principal"
          value={topPlatform ? topPlatform.label : "-"}
          subtitle={topPlatform ? `${topPlatform.count} leads (${topPlatform.percentage}%)` : "Sem dados"}
          icon={BarChart3}
        />
      </div>
    </div>
  );
}
