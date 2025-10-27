import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutoInsight } from "@/types/analytics";
import { Target, TrendingUp, DollarSign, Zap, LucideIcon } from "lucide-react";

interface AutoInsightsWidgetProps {
  insights: AutoInsight[];
}

export function AutoInsightsWidget({ insights }: AutoInsightsWidgetProps) {
  if (insights.length === 0) return null;

  const getIcon = (tipo: AutoInsight['tipo']): LucideIcon => {
    switch (tipo) {
      case 'best_conversion':
        return Target;
      case 'most_leads':
        return TrendingUp;
      case 'highest_ticket':
        return DollarSign;
      case 'fastest_conversion':
        return Zap;
    }
  };

  const getTitle = (tipo: AutoInsight['tipo']): string => {
    switch (tipo) {
      case 'best_conversion':
        return 'Melhor Conversão';
      case 'most_leads':
        return 'Mais Leads';
      case 'highest_ticket':
        return 'Maior Ticket';
      case 'fastest_conversion':
        return 'Conversão Rápida';
    }
  };


  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {insights.map((insight) => {
        const Icon = getIcon(insight.tipo);
        const title = getTitle(insight.tipo);
        
        return (
          <Card key={insight.id} className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground capitalize">
                  {insight.canal}
                </p>
                <p className="text-3xl font-bold">
                  {insight.valor}
                </p>
                <p className="text-xs text-muted-foreground">
                  {insight.descricao}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
