import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FunnelStage } from "@/hooks/useMarketingCsvAnalytics";

const FUNNEL_COLORS = [
  "hsl(221, 83%, 53%)",   // blue
  "hsl(262, 83%, 58%)",   // purple
  "hsl(25, 95%, 53%)",    // orange
  "hsl(142, 71%, 45%)",   // green
  "hsl(346, 77%, 50%)",   // rose
];

interface Props {
  data: FunnelStage[];
}

export function MarketingFunnelChart({ data }: Props) {
  if (!data.length) {
    return (
      <Card className="h-full">
        <CardHeader><CardTitle>Funil de Conversão</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p></CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Funil de Conversão</CardTitle>
        <p className="text-sm text-muted-foreground">Jornada completa dos leads</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {data.map((stage, index) => {
            const widthPercent = Math.max((stage.count / maxCount) * 100, 12);
            const color = FUNNEL_COLORS[index % FUNNEL_COLORS.length];

            return (
              <div key={stage.stage} className="flex items-center gap-3">
                <div className="w-24 text-sm font-medium text-right text-muted-foreground truncate">
                  {stage.stage}
                </div>
                <div className="flex-1 flex items-center">
                  <div
                    className="h-10 rounded-md flex items-center justify-center transition-all duration-500"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: color,
                      minWidth: "60px",
                    }}
                  >
                    <span className="text-white text-sm font-semibold px-2 whitespace-nowrap">
                      {stage.count}
                    </span>
                  </div>
                  <span className="ml-2 text-xs text-muted-foreground whitespace-nowrap">
                    {stage.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
