import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LeadsEvolutionData } from "@/types/dashboard";
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
          <Skeleton className="h-[350px] w-full" />
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
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="atualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="anteriorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="4 4" 
              horizontal={true} 
              vertical={false} 
              stroke="hsl(var(--border))" 
            />
            <XAxis 
              dataKey="mes" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="atual"
              name="Período Atual"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              fill="url(#atualGradient)"
              dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 0, r: 4 }}
              activeDot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 0, r: 6 }}
            />
            <Area
              type="monotone"
              dataKey="anterior"
              name="Período Anterior"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#anteriorGradient)"
              dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 0, r: 3 }}
              activeDot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 0, r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
