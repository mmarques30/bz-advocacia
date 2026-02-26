import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceDistribution } from "@/hooks/useMarketingCsvAnalytics";
import { chartTheme } from "@/lib/chartConfig";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const BRAND_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
];

interface Props {
  data: ServiceDistribution[];
}

const renderCustomLabel = ({ name, percent }: { name: string; percent: number }) => {
  if (percent < 0.05) return null;
  return `${name} (${(percent * 100).toFixed(0)}%)`;
};

export function MarketingServiceDistribution({ data }: Props) {
  if (!data.length) {
    return (
      <Card className="h-full">
        <CardHeader><CardTitle>Distribuição por Serviço</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p></CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data.map((d) => ({ ...d, percentage: total > 0 ? Math.round((d.count / total) * 100) : 0 }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Distribuição por Serviço</CardTitle>
        <p className="text-sm text-muted-foreground">Tipos de serviços mais demandados</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="service"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              label={renderCustomLabel}
              labelLine={false}
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={chartTheme.tooltip.contentStyle}
              formatter={(value: number, name: string) => [`${value} leads`, name]}
            />
            <Legend
              formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
