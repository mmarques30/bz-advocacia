import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Percent, Receipt } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { useKPIsFinanceiros } from "@/hooks/useFinanceiro";
import { useKPIsDespesas } from "@/hooks/useDespesas";

export function FinanceiroKPIs() {
  const { data: kpis, isLoading } = useKPIsFinanceiros();
  const { data: kpisDespesas, isLoading: isLoadingDespesas } = useKPIsDespesas();

  const receitaMes = kpis?.receita_mes || 0;
  const despesasMes = kpisDespesas?.total_mes || 0;
  const lucroLiquido = receitaMes - despesasMes;
  const margemLucro = receitaMes > 0 ? (lucroLiquido / receitaMes) * 100 : 0;

  const kpiData = [
    {
      title: "Receita Total do Mês",
      value: receitaMes,
      icon: DollarSign,
      format: "currency" as const,
      trend: "positive" as const,
    },
    {
      title: "Despesas do Mês",
      value: despesasMes,
      icon: TrendingDown,
      format: "currency" as const,
      trend: "negative" as const,
    },
    {
      title: "Lucro Líquido",
      value: lucroLiquido,
      icon: TrendingUp,
      format: "currency" as const,
      trend: lucroLiquido >= 0 ? "positive" as const : "negative" as const,
    },
    {
      title: "Margem de Lucro",
      value: margemLucro.toFixed(1),
      icon: Percent,
      format: "percentage" as const,
    },
    {
      title: "A Receber no Mês",
      value: kpis?.a_receber_mes || 0,
      icon: Receipt,
      format: "currency" as const,
    },
    {
      title: "Despesas Atrasadas",
      value: kpisDespesas?.total_atrasado || 0,
      icon: AlertCircle,
      format: "currency" as const,
      trend: "negative" as const,
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
          loading={isLoading || isLoadingDespesas}
        />
      ))}
    </div>
  );
}
