import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useKPIsDespesas } from "@/hooks/useDespesas";

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function DespesasKPIs() {
  const { data: kpis, isLoading } = useKPIsDespesas();

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
      title: "Total do Mês",
      value: formatCurrency(kpis?.total_mes || 0),
      icon: Receipt,
      color: "text-blue-500",
    },
    {
      title: "Pagas no Mês",
      value: formatCurrency(kpis?.total_pago_mes || 0),
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      title: "Pendentes",
      value: formatCurrency(kpis?.total_pendente || 0),
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      title: "Em Atraso",
      value: formatCurrency(kpis?.total_atrasado || 0),
      icon: AlertTriangle,
      color: "text-destructive",
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
