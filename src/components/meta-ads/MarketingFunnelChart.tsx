import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { FunnelStage } from "@/hooks/useMarketingCsvAnalytics";
import { ArrowDown, TrendingDown } from "lucide-react";

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

  // Calculate evolution rate between stages
  const stagesWithEvolution = data.map((stage, index) => {
    const previousCount = index === 0 ? stage.count : data[index - 1].count;
    const evolutionRate = previousCount > 0 ? Math.round((stage.count / previousCount) * 100) : 0;
    return { ...stage, evolutionRate };
  });

  const isLastStage = (index: number) => index === stagesWithEvolution.length - 1;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Funil de Conversão</CardTitle>
        <p className="text-sm text-muted-foreground">Visão estratégica da jornada dos leads</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Etapa</TableHead>
              <TableHead className="text-right w-[70px]">Leads</TableHead>
              <TableHead className="w-[200px]">% do Total</TableHead>
              <TableHead className="text-right w-[110px]">Taxa Evolução</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stagesWithEvolution.map((stage, index) => {
              const progressValue = (stage.count / maxCount) * 100;
              const last = isLastStage(index);

              return (
                <TableRow key={stage.stage} className={last ? "bg-[hsl(var(--chart-4))]/5" : ""}>
                  <TableCell className="font-medium text-sm">{stage.stage}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {stage.count}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={progressValue}
                        className="h-2 flex-1 bg-muted"
                      />
                      <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                        {stage.percentage}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {index === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <TrendingDown className="h-3 w-3 text-muted-foreground" />
                        <span className={`text-xs font-medium tabular-nums ${last ? "text-[hsl(var(--chart-4))]" : "text-primary"}`}>
                          {stage.evolutionRate}%
                        </span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
