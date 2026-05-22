import { Card, CardContent } from "@/components/ui/card";
import { useVisaoGeralKPIs, useInadimplencia } from "@/hooks/useVisaoGeralFinanceiro";
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

interface Props {
  ano: number | null;
  mes?: number | null;
}

export function VisaoGeralKPIs({ ano, mes = null }: Props) {
  const { data: kpis, isLoading } = useVisaoGeralKPIs(ano, mes);
  const { data: inadimplencia, isLoading: loadingInad } = useInadimplencia();

  if (isLoading || loadingInad) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const items = [
    {
      label: "Receitas no Período",
      value: formatCurrency(kpis?.receitas || 0),
      sub: `${kpis?.receitasCount || 0} recebimentos`,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Despesas PJ",
      value: formatCurrency(kpis?.despesasPJ || 0),
      sub: "Custos operacionais",
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Resultado Líquido",
      value: formatCurrency(kpis?.resultado || 0),
      sub: (kpis?.resultado || 0) >= 0 ? "Positivo" : "Negativo",
      icon: DollarSign,
      color: (kpis?.resultado || 0) >= 0 ? "text-primary" : "text-destructive",
      bg: (kpis?.resultado || 0) >= 0 ? "bg-primary/10" : "bg-destructive/10",
    },
    {
      label: "Inadimplência",
      value: formatCurrency(inadimplencia?.total || 0),
      sub: `${inadimplencia?.count || 0} parcelas atrasadas`,
      icon: AlertTriangle,
      color: "text-[hsl(var(--chart-5))]",
      bg: "bg-[hsl(var(--chart-5))]/10",
    },
    {
      label: "Ticket Médio",
      value: formatCurrency(kpis?.ticketMedio || 0),
      sub: "Por recebimento",
      icon: BarChart3,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.bg}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
