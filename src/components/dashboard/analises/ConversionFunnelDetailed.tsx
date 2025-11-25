import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ConversionFunnelStage } from "@/types/analytics";
import { AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, TooltipProps } from "recharts";
import { chartColors } from "@/lib/chartConfig";

interface ConversionFunnelDetailedProps {
  data: ConversionFunnelStage[];
  gargalo?: { estagio: string; taxaPerdida: number };
  loading?: boolean;
}

// Tooltip customizado
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const avancaram = data.avancaram || 0;
  const perdidos = data.perdidos || 0;
  const total = avancaram + perdidos;
  const taxaConversao = total > 0 ? ((avancaram / total) * 100).toFixed(1) : '0.0';
  const taxaPerda = total > 0 ? ((perdidos / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
      <p className="font-bold text-card-foreground mb-2">{data.estagio}</p>
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-muted-foreground">Avançaram:</span>
          <span className="font-semibold text-card-foreground">{avancaram} ({taxaConversao}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted" />
          <span className="text-muted-foreground">Perdidos:</span>
          <span className="font-semibold text-card-foreground">{perdidos} ({taxaPerda}%)</span>
        </div>
        <div className="pt-2 mt-2 border-t border-border">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-bold ml-2 text-card-foreground">{total}</span>
        </div>
      </div>
    </div>
  );
};

// Legenda customizada
const CustomLegend = () => (
  <div className="flex items-center justify-center gap-6 mt-4 text-sm">
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded bg-primary" />
      <span className="text-muted-foreground">Avançaram para próxima etapa</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded bg-muted" />
      <span className="text-muted-foreground">Perdidos/Desqualificados</span>
    </div>
  </div>
);

export function ConversionFunnelDetailed({ data, gargalo, loading }: ConversionFunnelDetailedProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Transformar dados para formato Recharts
  const chartData = data.map(stage => ({
    estagio: stage.estagio,
    total: stage.count,
    avancaram: stage.count - stage.perdido,
    perdidos: stage.perdido,
    taxaConversao: stage.taxaConversao,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Funil de Conversão Detalhado</CardTitle>
            <CardDescription>Visualização do fluxo de leads por estágio</CardDescription>
          </div>
          {gargalo && (
            <Badge variant="destructive" className="gap-2">
              <AlertTriangle className="h-3 w-3" />
              Gargalo: {gargalo.estagio} (-{gargalo.taxaPerdida.toFixed(1)}%)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart 
            data={chartData} 
            layout="vertical" 
            barSize={40}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis 
              type="number" 
              tickFormatter={(value) => `${value}`}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              dataKey="estagio" 
              type="category" 
              width={100}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.2)' }} />
            <Legend content={<CustomLegend />} />
            
            {/* Barra de leads que avançaram */}
            <Bar 
              dataKey="avancaram" 
              stackId="stack" 
              name="Avançaram"
              radius={[0, 4, 4, 0]}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.estagio === gargalo?.estagio 
                    ? chartColors.danger 
                    : chartColors.primary
                  } 
                />
              ))}
            </Bar>
            
            {/* Barra de leads perdidos */}
            <Bar 
              dataKey="perdidos" 
              stackId="stack" 
              name="Perdidos"
              fill={chartColors.muted}
              radius={[0, 4, 4, 0]}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
