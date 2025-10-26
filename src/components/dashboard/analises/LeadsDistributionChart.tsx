import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ChannelPerformance } from "@/types/analytics";

interface LeadsDistributionChartProps {
  data?: ChannelPerformance[];
  loading?: boolean;
}

const COLORS = {
  google: 'hsl(var(--chart-1))',
  meta: 'hsl(var(--chart-2))',
  indicacao: 'hsl(var(--chart-3))',
  site: 'hsl(var(--chart-4))',
  outro: 'hsl(var(--chart-5))',
};

export function LeadsDistributionChart({ data, loading }: LeadsDistributionChartProps) {
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

  const chartData = data?.map(item => ({
    name: item.origem,
    value: item.totalLeads,
    percentage: 0,
  })) || [];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  chartData.forEach(item => {
    item.percentage = total > 0 ? (item.value / total) * 100 : 0;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Leads por Canal</CardTitle>
        <CardDescription>Origem dos leads no período</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.outro} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} leads`, 'Total']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}
