import { TrendingUp, TrendingDown, DollarSign, Users, Target, MousePointerClick, Eye } from "lucide-react";
import { MetaKPIs } from "@/types/meta-ads";

interface MetaAdsKPIsProps {
  kpis: MetaKPIs;
  isLoading?: boolean;
}

export function MetaAdsKPIs({ kpis, isLoading }: MetaAdsKPIsProps) {
  const cards = [
    {
      title: "Investimento",
      value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(kpis.gasto),
      variacao: kpis.gastoVariacao,
      icon: DollarSign,
      color: "text-muted-foreground",
    },
    {
      title: "Leads",
      value: kpis.leads.toString(),
      variacao: kpis.leadsVariacao,
      icon: Users,
      color: "text-muted-foreground",
    },
    {
      title: "Custo/Lead",
      value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(kpis.custoLead),
      variacao: kpis.custoLeadVariacao,
      icon: Target,
      color: "text-muted-foreground",
    },
    {
      title: "Cliques",
      value: kpis.cliques.toLocaleString("pt-BR"),
      variacao: kpis.cliquesVariacao,
      icon: MousePointerClick,
      color: "text-muted-foreground",
    },
    {
      title: "CTR",
      value: `${kpis.ctr.toFixed(2)}%`,
      variacao: kpis.ctrVariacao,
      icon: Eye,
      color: "text-muted-foreground",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
            <div className="h-8 bg-muted rounded w-full mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const isPositive = card.variacao > 0;
        const isNegative = card.variacao < 0;

        return (
          <div key={card.title} className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="text-3xl font-bold mb-2">{card.value}</p>
            <div className="flex items-center text-xs">
              {card.variacao !== 0 && (
                <>
                  {isPositive && <TrendingUp className="h-3 w-3 mr-1 text-green-600" />}
                  {isNegative && <TrendingDown className="h-3 w-3 mr-1 text-red-600" />}
                  <span className={isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-muted-foreground"}>
                    {isPositive ? "+" : ""}{card.variacao}% vs anterior
                  </span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
