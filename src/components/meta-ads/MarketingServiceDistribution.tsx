import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceDistribution } from "@/hooks/useMarketingCsvAnalytics";
import { chartTheme } from "@/lib/chartConfig";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const SERVICE_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(262, 83%, 58%)",
  "hsl(25, 95%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(346, 77%, 50%)",
  "hsl(199, 89%, 48%)",
  "hsl(43, 96%, 56%)",
  "hsl(280, 67%, 51%)",
];

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
            <Bar dataKey="count" name="Leads" radius={[0, 4, 4, 0]}>
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={SERVICE_COLORS[index % SERVICE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
