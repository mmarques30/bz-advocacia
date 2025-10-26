import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StageTime } from "@/types/analytics";

interface TimePerStageTableProps {
  data: StageTime[];
  loading?: boolean;
}

export function TimePerStageTable({ data, loading }: TimePerStageTableProps) {
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

  const getTimeBadgeVariant = (dias: number): "default" | "secondary" | "destructive" => {
    if (dias <= 7) return "default";
    if (dias <= 14) return "secondary";
    return "destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tempo Médio por Estágio</CardTitle>
        <CardDescription>Duração em dias</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estágio</TableHead>
              <TableHead className="text-right">Tempo Médio</TableHead>
              <TableHead className="text-right">Variação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((stage) => (
              <TableRow key={stage.estagio}>
                <TableCell className="font-medium">{stage.estagio}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={getTimeBadgeVariant(stage.tempoMedioDias)}>
                    {Math.round(stage.tempoMedioDias)} dias
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {Math.round(stage.minDias)} - {Math.round(stage.maxDias)} dias
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
