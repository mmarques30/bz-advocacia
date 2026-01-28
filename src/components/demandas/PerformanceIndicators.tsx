import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, PlusCircle, CheckCircle2 } from "lucide-react";

interface PerformanceData {
  taxaConclusao: number;
  tempoMedioConclusao: number;
  criadasNoMes: number;
  concluidasNoMes: number;
}

interface PerformanceIndicatorsProps {
  data?: PerformanceData;
  loading?: boolean;
}

export function PerformanceIndicators({ data, loading }: PerformanceIndicatorsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const taxaConclusao = data?.taxaConclusao || 0;
  const tempoMedio = data?.tempoMedioConclusao || 0;
  const criadas = data?.criadasNoMes || 0;
  const concluidas = data?.concluidasNoMes || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-seasons">
          <TrendingUp className="h-4 w-4 text-primary" />
          Indicadores do Mês
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Taxa de Conclusão */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Taxa de Conclusão</span>
            <span className="text-2xl font-bold text-primary">{taxaConclusao}%</span>
          </div>
          <Progress 
            value={Math.min(taxaConclusao, 100)} 
            className="h-2"
          />
        </div>

        {/* Tempo Médio */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Tempo Médio</span>
          </div>
          <div className="text-right">
            <span className="text-xl font-semibold">{tempoMedio}</span>
            <span className="text-sm text-muted-foreground ml-1">dias</span>
          </div>
        </div>

        {/* Criadas vs Concluídas */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Badge variant="outline" className="gap-1 py-2 px-3 flex-1 justify-center">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="font-semibold">{criadas}</span>
              <span className="text-xs text-muted-foreground">criadas</span>
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <Badge 
              variant="outline" 
              className="gap-1 py-2 px-3 flex-1 justify-center bg-green-500/10 text-green-600 border-green-200"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="font-semibold">{concluidas}</span>
              <span className="text-xs">concluídas</span>
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
