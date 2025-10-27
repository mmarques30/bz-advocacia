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

  const getBackgroundColor = (tipo: AutoInsight['tipo']) => {
    switch (tipo) {
      case 'best_conversion':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
      case 'most_leads':
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';
      case 'highest_ticket':
        return 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800';
      case 'fastest_conversion':
        return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-secondary/50';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {insights.map((insight) => {
        const Icon = getIcon(insight.tipo);
        const title = getTitle(insight.tipo);
        
        return (
          <Card key={insight.id} className={`border ${getBackgroundColor(insight.tipo)}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-4 w-4" />
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
