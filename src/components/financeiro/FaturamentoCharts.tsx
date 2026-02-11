import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useDistribuicaoTipo } from "@/hooks/useFinanceiro";
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
  const { data: distribuicao } = useDistribuicaoTipo(filters);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);

  const formatCurrencyFull = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Faturamento por Responsável</span>
          <span className="text-xs font-normal text-muted-foreground">Evolução mensal</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {distribuicao && distribuicao.length > 0 && tiposServico.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distribuicao} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} className="text-muted-foreground" />
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
                <Bar key={tipo} dataKey={tipo} fill={COLORS[index % COLORS.length]} name={tipo} stackId="tipos" />
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
  );
}
