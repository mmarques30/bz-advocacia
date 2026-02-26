import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FunnelStage } from "@/hooks/useMarketingCsvAnalytics";
import { chartColors, chartTheme } from "@/lib/chartConfig";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const FUNNEL_COLORS = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.warning,
  chartColors.success,
  chartColors.dark,
];

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

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Funil de Conversão</CardTitle>
        <p className="text-sm text-muted-foreground">Jornada completa dos leads</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray={chartTheme.grid.strokeDasharray} stroke={chartTheme.grid.stroke} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="stage" type="category" tick={{ fontSize: 12 }} width={100} />
            <Tooltip
              contentStyle={chartTheme.tooltip.contentStyle}
              formatter={(value: number, _name: string, props: any) => [
                `${value} (${props.payload.percentage}%)`,
                "Leads",
              ]}
            />
            <Bar dataKey="count" name="Leads" radius={[0, 4, 4, 0]}>
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
