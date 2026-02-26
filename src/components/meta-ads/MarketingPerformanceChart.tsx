import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyConversion } from "@/hooks/useMarketingCsvAnalytics";
import { chartColors, chartTheme } from "@/lib/chartConfig";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface Props {
  data: DailyConversion[];
}

export function MarketingPerformanceChart({ data }: Props) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader><CardTitle>Performance Diária: Leads vs Conversões</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground py-8 text-center">Sem dados para o período selecionado</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Diária: Leads vs Conversões</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.2} />
                <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray={chartTheme.grid.strokeDasharray} stroke={chartTheme.grid.stroke} />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
            <Tooltip contentStyle={chartTheme.tooltip.contentStyle} />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="leads"
              name="Leads"
              stroke={chartColors.primary}
              fill="url(#leadsFill)"
              strokeWidth={2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="conversoes"
              name="Conversões"
              stroke={chartColors.success}
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="taxa"
              name="Taxa %"
              stroke={chartColors.warning}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
