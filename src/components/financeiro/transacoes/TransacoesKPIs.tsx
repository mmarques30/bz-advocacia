import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKPIsTransacoes } from "@/hooks/useTransacoesFinanceiras";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { TransacoesFilters } from "@/types/transacoes";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

interface TransacoesKPIsProps {
  filters?: TransacoesFilters;
}

export function TransacoesKPIs({ filters }: TransacoesKPIsProps) {
  const { data: kpis, isLoading, error } = useKPIsTransacoes(filters || {});

  // Gera título dinâmico baseado nos filtros
  const getFilterLabel = () => {
    if (filters?.dataInicio && filters?.dataFim) {
      return `${filters.dataInicio.toLocaleDateString('pt-BR')} - ${filters.dataFim.toLocaleDateString('pt-BR')}`;
    }
    if (filters?.ano) {
      return String(filters.ano);
    }
    return "Tudo";
  };

  const filterLabel = getFilterLabel();

  // Calcular margem
  const margem = kpis?.receitas && kpis.receitas > 0 
    ? ((kpis.resultado || 0) / kpis.receitas) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-1 pt-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <Skeleton className="h-6 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        Erro ao carregar KPIs: {(error as Error).message}
      </div>
    );
  }

  const kpiData = [
    {
      title: `Receita Total (${filterLabel})`,
      value: formatCurrency(kpis?.receitas || 0),
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: `Despesas (${filterLabel})`,
      value: formatCurrency(kpis?.despesas || 0),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Lucro",
      value: formatCurrency(kpis?.resultado || 0),
      icon: DollarSign,
      color: (kpis?.resultado || 0) >= 0 ? "text-emerald-600" : "text-red-600",
      bgColor: (kpis?.resultado || 0) >= 0 ? "bg-emerald-100" : "bg-red-100",
    },
    {
      title: "Margem",
      value: `${margem.toFixed(1)}%`,
      subtitle: "Lucro / Receita Total",
      icon: Percent,
      color: margem >= 0 ? "text-blue-600" : "text-red-600",
      bgColor: margem >= 0 ? "bg-blue-100" : "bg-red-100",
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <div className={`p-1.5 rounded-full ${kpi.bgColor}`}>
              <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
            {kpi.subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}