import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart } from "recharts";
import { RevenueData } from "@/types/dashboard";
import { chartColors, chartTheme } from "@/lib/chartConfig";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfigurarMetaDialog } from "./ConfigurarMetaDialog";

interface RevenueChartProps {
  data: RevenueData[];
  loading?: boolean;
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receita Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-seasons">Receita Mensal</CardTitle>
        <ConfigurarMetaDialog />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <CartesianGrid {...chartTheme.grid} />
            <XAxis dataKey="mes" />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat('pt-BR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
            />
            <Tooltip
              {...chartTheme.tooltip}
              formatter={(value: number) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(value)
              }
            />
            <Legend />
            <Bar
              dataKey="receita"
              name="Receita"
              fill={chartColors.primary}
              radius={[8, 8, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="meta"
              name="Meta"
              stroke={chartColors.secondary}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
