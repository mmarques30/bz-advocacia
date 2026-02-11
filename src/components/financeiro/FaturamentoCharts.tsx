import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from "recharts";
import { useFluxoCaixa, useDistribuicaoTipo, useProjetadoVsRealizado } from "@/hooks/useFinanceiro";
import type { FaturamentoFiltersState } from "./FaturamentoFilters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

interface FaturamentoChartsProps {
  filters?: FaturamentoFiltersState;
}

const COLORS = [
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))', 
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
];

// Mapeamento de códigos para nomes de responsáveis
const mapResponsavel = (codigo: string): string => {
  const mapeamento: Record<string, string> = {
    'pf': 'Liziane/Juliana',
    'PF': 'Liziane/Juliana',
    'pj': 'B&Z',
    'PJ': 'B&Z',
  };
  return mapeamento[codigo] || codigo;
};

export function FaturamentoCharts({ filters }: FaturamentoChartsProps) {
  const { data: fluxoCaixa } = useFluxoCaixa(filters);
  const { data: distribuicao } = useDistribuicaoTipo(filters);
  const { data: projetadoVsRealizado } = useProjetadoVsRealizado();

  const getPeriodoLabel = () => {
    if (filters?.dateRange?.from && filters?.dateRange?.to) {
      return `${format(filters.dateRange.from, "dd/MM/yyyy")} - ${format(filters.dateRange.to, "dd/MM/yyyy")}`;
    }
    if (filters?.dateRange?.from) {
      return `A partir de ${format(filters.dateRange.from, "dd/MM/yyyy")}`;
    }
    return "Período atual";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value);
  };

  const formatCurrencyFull = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Detectar granularidade dos dados de fluxo de caixa
  const fluxoGranularidade = useMemo(() => {
    if (!fluxoCaixa || fluxoCaixa.length === 0) return 'dia';
    return (fluxoCaixa[0] as any)?.granularidade || 'dia';
  }, [fluxoCaixa]);

  const formatXAxisDate = (dateStr: string) => {
    try {
      if (fluxoGranularidade === 'mes') {
        // Formato yyyy-MM para mês
        const [year, month] = dateStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return format(date, "MMM/yy", { locale: ptBR });
      }
      return format(new Date(dateStr), "dd/MM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatTooltipLabel = (label: string) => {
    try {
      if (fluxoGranularidade === 'mes') {
        const [year, month] = label.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return format(date, "MMMM 'de' yyyy", { locale: ptBR });
      }
      return format(new Date(label), "dd 'de' MMMM", { locale: ptBR });
    } catch {
      return label;
    }
  };

  // Extrair tipos únicos da distribuição para renderizar múltiplas linhas/barras
  const tiposServico = useMemo(() => {
    if (!distribuicao || distribuicao.length === 0) return [];
    const tipos = (distribuicao[0] as any)?._tipos || [];
    return tipos.filter((t: string) => t !== '_tipos' && t !== 'mes');
  }, [distribuicao]);

  const formatDistribuicaoXAxis = (mesStr: string) => {
    try {
      const [year, month] = mesStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return format(date, "MMM/yy", { locale: ptBR });
    } catch {
      return mesStr;
    }
  };

  const formatDistribuicaoTooltipLabel = (label: string) => {
    try {
      const [year, month] = label.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return format(date, "MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return label;
    }
  };

  // Custom Tooltip para o gráfico de fluxo de caixa
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground mb-1">
            {formatTooltipLabel(label)}
          </p>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: 'hsl(var(--chart-2))' }}
            />
            <span className="text-sm text-muted-foreground">Entradas:</span>
            <span className="text-sm font-semibold text-foreground">
              {formatCurrencyFull(payload[0].value)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Projetado vs Realizado</span>
            <span className="text-xs font-normal text-muted-foreground">Últimos 12 meses</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projetadoVsRealizado && projetadoVsRealizado.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projetadoVsRealizado} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrencyFull(value),
                    name === 'realizado' ? 'Realizado' : 'Projetado',
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend formatter={(value) => (value === 'realizado' ? 'Realizado' : 'Projetado')} />
                <Bar dataKey="realizado" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="projetado" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Fluxo de Caixa ({getPeriodoLabel()})</span>
            <span className="text-xs font-normal text-muted-foreground">
              {fluxoGranularidade === 'mes' ? 'Agrupado por mês' : 'Diário'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fluxoCaixa && fluxoCaixa.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={fluxoCaixa} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="entradasGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="4 4" 
                  horizontal={true} 
                  vertical={false} 
                  className="stroke-border" 
                />
                <XAxis 
                  dataKey="data" 
                  tickFormatter={formatXAxisDate}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  interval={fluxoGranularidade === 'mes' ? 0 : 'preserveStartEnd'}
                  angle={fluxoGranularidade === 'mes' && fluxoCaixa.length > 6 ? -45 : 0}
                  textAnchor={fluxoGranularidade === 'mes' && fluxoCaixa.length > 6 ? 'end' : 'middle'}
                  height={fluxoGranularidade === 'mes' && fluxoCaixa.length > 6 ? 60 : 30}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="entradas"
                  fill="url(#entradasGradient)"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{
                    fill: 'hsl(var(--chart-1))',
                    stroke: 'hsl(var(--chart-1))',
                    strokeWidth: 2,
                    r: 5,
                  }}
                  activeDot={{
                    fill: 'hsl(var(--chart-1))',
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 2,
                    r: 7,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Nenhum dado disponível para o período selecionado
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Faturamento por Responsável</span>
            <span className="text-xs font-normal text-muted-foreground">
              Evolução mensal
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {distribuicao && distribuicao.length > 0 && tiposServico.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={distribuicao}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="mes" 
                  tickFormatter={formatDistribuicaoXAxis}
                  tick={{ fontSize: 11 }}
                  angle={distribuicao.length > 6 ? -45 : 0}
                  textAnchor={distribuicao.length > 6 ? "end" : "middle"}
                  height={distribuicao.length > 6 ? 60 : 30}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [formatCurrencyFull(value), mapResponsavel(name)]}
                  labelFormatter={formatDistribuicaoTooltipLabel}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend formatter={(value) => mapResponsavel(value)} />
                {tiposServico.map((tipo: string, index: number) => (
                  <Bar 
                    key={tipo}
                    dataKey={tipo} 
                    fill={COLORS[index % COLORS.length]}
                    name={tipo}
                    stackId="tipos"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Nenhum dado disponível para o período selecionado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}