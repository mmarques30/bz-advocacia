import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Percent, Receipt } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { useKPIsFinanceiros } from "@/hooks/useFinanceiro";

export function FinanceiroKPIs() {
  const { data: kpis, isLoading } = useKPIsFinanceiros();

  const kpiData = [
    {
      title: "Receita Total do Mês",
      value: kpis?.receita_mes || 0,
      icon: DollarSign,
      format: "currency" as const,
    },
    {
      title: "Recebido no Mês",
      value: kpis?.recebido_mes || 0,
      icon: TrendingUp,
      format: "currency" as const,
    },
    {
      title: "A Receber no Mês",
      value: kpis?.a_receber_mes || 0,
      icon: Receipt,
      format: "currency" as const,
    },
    {
      title: "Valor Atrasado",
      value: kpis?.valor_atrasado || 0,
      icon: AlertCircle,
      format: "currency" as const,
    },
    {
      title: "Taxa de Inadimplência",
      value: kpis?.taxa_inadimplencia?.toFixed(1) || 0,
      icon: Percent,
      format: "percentage" as const,
    },
    {
      title: "Ticket Médio",
      value: kpis?.ticket_medio || 0,
      icon: TrendingDown,
      format: "currency" as const,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {kpiData.map((kpi) => (
        <KPICard
          key={kpi.title}
          title={kpi.title}
          value={kpi.value}
          icon={kpi.icon}
          format={kpi.format}
          loading={isLoading}
        />
      ))}
    </div>
  );
}
