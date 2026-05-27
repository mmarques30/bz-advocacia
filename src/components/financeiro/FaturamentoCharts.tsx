import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { useDistribuicaoTipo } from "@/hooks/useFinanceiro";
import type { FaturamentoFiltersState } from "./FaturamentoFilters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

interface FaturamentoChartsProps {
  filters?: FaturamentoFiltersState;
  selectedMes?: string | null;
  onSelectMonth?: (mes: string) => void;
}

export function FaturamentoCharts({ filters, selectedMes, onSelectMonth }: FaturamentoChartsProps) {
  const { data: distribuicao } = useDistribuicaoTipo(filters);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);

  const formatCurrencyFull = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Soma todos os tipos/responsaveis de cada mes num total unico por mes.
  const chartData = useMemo(() => {
    if (!distribuicao) return [];
    return distribuicao.map((row: any) => {
      const tipos: string[] = row._tipos || [];
      const total = tipos.reduce((sum, tipo) => sum + (Number(row[tipo]) || 0), 0);
      return { mes: row.mes as string, total };
    });
  }, [distribuicao]);

  const formatXAxis = (mesStr: string) => {
    try {
      const [year, month] = mesStr.split('-');
      return format(new Date(parseInt(year), parseInt(month) - 1, 1), "MMM/yy", { locale: ptBR });
    } catch {
      return mesStr;
    }
  };

  const formatTooltipLabel = (label: string) => {
    try {
      const [year, month] = label.split('-');
      return format(new Date(parseInt(year), parseInt(month) - 1, 1), "MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return label;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Faturamento por mês</span>
          <span className="text-xs font-normal text-muted-foreground">
            {onSelectMonth ? "Clique numa barra para filtrar o mês" : "Evolução mensal"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              onClick={(state: any) => {
                const mes = state?.activeLabel;
                if (mes && onSelectMonth) onSelectMonth(String(mes));
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="mes"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 11 }}
                angle={chartData.length > 6 ? -45 : 0}
                textAnchor={chartData.length > 6 ? "end" : "middle"}
                height={chartData.length > 6 ? 60 : 30}
                className="text-muted-foreground"
              />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip
                formatter={(value: number) => [formatCurrencyFull(value), "Faturamento"]}
                labelFormatter={formatTooltipLabel}
                cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar
                dataKey="total"
                name="Faturamento"
                radius={[4, 4, 0, 0]}
                cursor={onSelectMonth ? "pointer" : undefined}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.mes}
                    fill={entry.mes === selectedMes ? 'hsl(var(--primary))' : 'hsl(var(--chart-1))'}
                    opacity={selectedMes && entry.mes !== selectedMes ? 0.4 : 1}
                  />
                ))}
              </Bar>
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
