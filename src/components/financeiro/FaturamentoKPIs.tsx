import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, FileText, AlertTriangle } from "lucide-react";
import { useKPIsFinanceiros } from "@/hooks/useFinanceiro";
import type { FaturamentoFiltersState } from "./FaturamentoFilters";

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

interface FaturamentoKPIsProps {
  filters?: FaturamentoFiltersState;
}

export function FaturamentoKPIs({ filters }: FaturamentoKPIsProps) {
  const { data: kpis, isLoading } = useKPIsFinanceiros(filters);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpiData = [
    {
      title: "Receita do Mês",
      value: formatCurrency(kpis?.receita_mes || 0),
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      title: "A Receber",
      value: formatCurrency(kpis?.a_receber_mes || 0),
      icon: TrendingUp,
      color: "text-blue-500",
    },
    {
      title: "Em Atraso",
      value: formatCurrency(kpis?.valor_atrasado || 0),
      icon: AlertTriangle,
      color: "text-destructive",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(kpis?.ticket_medio || 0),
      icon: FileText,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {kpiData.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
