import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ConversionFunnelStage } from "@/types/analytics";
import { AlertTriangle, ChevronRight } from "lucide-react";

interface ConversionFunnelDetailedProps {
  data: ConversionFunnelStage[];
  gargalo?: { estagio: string; taxaPerdida: number };
  loading?: boolean;
}

export function ConversionFunnelDetailed({ data, gargalo, loading }: ConversionFunnelDetailedProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Funil de Conversão Detalhado</CardTitle>
            <CardDescription>Visualização do fluxo de leads por estágio</CardDescription>
          </div>
          {gargalo && (
            <Badge variant="destructive" className="gap-2">
              <AlertTriangle className="h-3 w-3" />
              Gargalo: {gargalo.estagio} (-{gargalo.taxaPerdida.toFixed(1)}%)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((stage, index) => {
          const isGargalo = gargalo?.estagio === stage.estagio;
          const width = (stage.count / maxCount) * 100;
          
          return (
            <div key={stage.estagio} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium min-w-[120px]">{stage.estagio}</span>
                  <span className="text-2xl font-bold">{stage.count}</span>
                  <Badge variant="secondary">{stage.percentage.toFixed(1)}%</Badge>
                </div>
                {stage.taxaConversao < 100 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Conversão: {stage.taxaConversao.toFixed(1)}%</span>
                    {stage.perdido > 0 && (
                      <Badge variant="outline" className="text-destructive">
                        -{stage.perdido} perdidos
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              <div className="relative h-12 bg-secondary/20 rounded-lg overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isGargalo 
                      ? 'bg-destructive' 
                      : 'bg-gradient-to-r from-primary to-primary/70'
                  }`}
                  style={{ width: `${width}%` }}
                />
              </div>
              
              {index < data.length - 1 && (
                <div className="flex items-center justify-center py-1">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
