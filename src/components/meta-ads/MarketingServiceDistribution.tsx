import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceDistribution } from "@/hooks/useMarketingCsvAnalytics";
import { chartTheme } from "@/lib/chartConfig";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const BRAND_COLORS = [
  "hsl(var(--chart-1))",      // Terra cota
  "hsl(142, 76%, 36%)",       // Verde
  "hsl(217, 91%, 60%)",       // Azul
  "hsl(32, 95%, 55%)",        // Laranja
  "hsl(270, 70%, 55%)",       // Roxo
  "hsl(var(--chart-5))",      // Amarelo
  "hsl(340, 75%, 55%)",       // Rosa
  "hsl(var(--chart-3))",      // Escuro
  "hsl(180, 60%, 45%)",       // Teal
  "hsl(0, 84%, 60%)",         // Vermelho
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
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={chartTheme.tooltip.contentStyle}
              formatter={(value: number, name: string, props: any) => [
                `${value} leads (${props.payload.percentage}%)`, name
              ]}
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
