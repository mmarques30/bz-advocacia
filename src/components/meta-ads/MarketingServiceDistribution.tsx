import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceDistribution } from "@/hooks/useMarketingCsvAnalytics";
import { chartColors, chartTheme } from "@/lib/chartConfig";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: ServiceDistribution[];
}

export function MarketingServiceDistribution({ data }: Props) {
  if (!data.length) {
    return (
      <Card className="h-full">
        <CardHeader><CardTitle>Distribuição por Serviço</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p></CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Distribuição por Serviço</CardTitle>
        <p className="text-sm text-muted-foreground">Tipos de serviços mais demandados</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray={chartTheme.grid.strokeDasharray} stroke={chartTheme.grid.stroke} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="service" type="category" tick={{ fontSize: 12 }} width={120} />
            <Tooltip contentStyle={chartTheme.tooltip.contentStyle} />
            <Bar dataKey="count" name="Leads" fill={chartColors.primary} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
