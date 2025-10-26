import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { FunnelStage } from "@/types/dashboard";
import { chartColors, chartTheme } from "@/lib/chartConfig";
import { Skeleton } from "@/components/ui/skeleton";

interface ConversionFunnelProps {
  data: FunnelStage[];
  loading?: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.8)',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--primary) / 0.4)',
  'hsl(var(--primary) / 0.2)',
];

export function ConversionFunnel({ data, loading }: ConversionFunnelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-seasons">Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid {...chartTheme.grid} />
            <XAxis type="number" />
            <YAxis dataKey="estagio" type="category" width={80} />
            <Tooltip {...chartTheme.tooltip} />
            <Bar dataKey="count" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {data.map((stage) => (
            <div key={stage.estagio} className="text-center">
              <p className="text-xs text-muted-foreground">{stage.estagio}</p>
              <p className="text-lg font-bold text-foreground">{stage.count}</p>
              <p className="text-xs text-muted-foreground">{stage.percentage}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
