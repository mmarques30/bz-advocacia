import { Card, CardContent } from "@/components/ui/card";
import { AutoInsight } from "@/types/analytics";

interface AutoInsightsWidgetProps {
  insights: AutoInsight[];
}

export function AutoInsightsWidget({ insights }: AutoInsightsWidgetProps) {
  if (insights.length === 0) return null;

  const getBackgroundColor = (tipo: AutoInsight['tipo']) => {
    switch (tipo) {
      case 'best_conversion':
        return 'bg-green-500/10 border-green-500/20';
      case 'most_leads':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'highest_ticket':
        return 'bg-purple-500/10 border-purple-500/20';
      case 'fastest_conversion':
        return 'bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'bg-secondary/50';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {insights.map((insight) => (
        <Card key={insight.id} className={`border-2 ${getBackgroundColor(insight.tipo)}`}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <span className="text-4xl">{insight.icone}</span>
              <p className="text-sm text-muted-foreground">{insight.texto}</p>
              <p className="text-2xl font-bold">{insight.valor}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
