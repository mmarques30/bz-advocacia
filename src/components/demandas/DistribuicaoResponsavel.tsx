import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from "recharts";
import { chartColors, chartTheme } from "@/lib/chartConfig";

interface ResponsavelDistribuicao {
  id: string;
  nome: string;
  total: number;
  atrasadas: number;
  concluidas: number;
  emAndamento: number;
}

interface DistribuicaoResponsavelProps {
  data?: ResponsavelDistribuicao[];
  loading?: boolean;
}

export function DistribuicaoResponsavel({ data, loading }: DistribuicaoResponsavelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data?.map(d => ({
    nome: d.nome,
    pendentes: d.total - d.concluidas - d.atrasadas,
    atrasadas: d.atrasadas,
    concluidas: d.concluidas,
  })) || [];

  const hasData = chartData.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-seasons">
          <Users className="h-4 w-4 text-primary" />
          Distribuição por Responsável
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <XAxis 
                type="number" 
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="nome" 
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip
                contentStyle={chartTheme.tooltip.contentStyle}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    pendentes: 'Pendentes',
                    atrasadas: 'Atrasadas',
                    concluidas: 'Concluídas',
                  };
                  return [value, labels[name] || name];
                }}
              />
              <Legend 
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    pendentes: 'Pendentes',
                    atrasadas: 'Atrasadas',
                    concluidas: 'Concluídas',
                  };
                  return labels[value] || value;
                }}
                wrapperStyle={{ fontSize: '11px' }}
              />
              <Bar 
                dataKey="pendentes" 
                stackId="a" 
                fill={chartColors.primary}
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="atrasadas" 
                stackId="a" 
                fill={chartColors.danger}
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="concluidas" 
                stackId="a" 
                fill={chartColors.success}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <Users className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma demanda atribuída</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
