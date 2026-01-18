import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKPIsTransacoes } from "@/hooks/useTransacoesFinanceiras";
import { TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";
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
  // Passa os filtros diretamente, sem fallback para ano atual
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

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
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
      title: "Resultado",
      value: formatCurrency(kpis?.resultado || 0),
      icon: DollarSign,
      color: (kpis?.resultado || 0) >= 0 ? "text-emerald-600" : "text-red-600",
      bgColor: (kpis?.resultado || 0) >= 0 ? "bg-emerald-100" : "bg-red-100",
    },
    {
      title: "PF vs PJ",
      value: `${formatCurrency(kpis?.receitasPF || 0)} / ${formatCurrency(kpis?.receitasPJ || 0)}`,
      subtitle: "Pessoa Física / Jurídica",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${kpi.bgColor}`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            {kpi.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
