import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LeadsEvolutionData } from "@/types/dashboard";
import { chartColors, chartTheme } from "@/lib/chartConfig";
import { Skeleton } from "@/components/ui/skeleton";

interface LeadsEvolutionProps {
  data: LeadsEvolutionData[];
  loading?: boolean;
}

export function LeadsEvolution({ data, loading }: LeadsEvolutionProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-seasons">Evolução de Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid {...chartTheme.grid} />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip {...chartTheme.tooltip} />
            <Legend />
            <Line
              type="monotone"
              dataKey="atual"
              name="Período Atual"
              stroke={chartColors.primary}
              strokeWidth={2}
              dot={{ fill: chartColors.primary }}
            />
            <Line
              type="monotone"
              dataKey="anterior"
              name="Período Anterior"
              stroke={chartColors.secondary}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: chartColors.secondary }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
