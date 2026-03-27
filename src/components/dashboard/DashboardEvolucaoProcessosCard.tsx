import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ProcessoEvolucaoMes } from "@/hooks/useProcessosEvolucao";

interface Props {
  data: ProcessoEvolucaoMes[];
  loading: boolean;
  abertos30d: number;
  variacao: number;
}

export function DashboardEvolucaoProcessosCard({ data, loading, abertos30d, variacao }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = variacao >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Evolução de Processos</CardTitle>
        <div className="text-right">
          <span className="text-2xl font-bold text-foreground">{abertos30d}</span>
          <div className={`flex items-center gap-1 justify-end text-xs ${isPositive ? "text-green-600" : "text-destructive"}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{isPositive ? "+" : ""}{variacao}% este mês</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--card-foreground))",
                }}
              />
              <Legend />
              <Bar dataKey="abertos" name="Abertos" stackId="a" fill="hsl(var(--chart-1))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="concluidos" name="Concluídos" stackId="a" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="acumulado"
                name="Total acumulado"
                stroke="hsl(var(--chart-5))"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
