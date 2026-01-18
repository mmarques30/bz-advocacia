import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useDespesasPorCategoria } from "@/hooks/useDespesas";
import { CATEGORIA_DESPESA_LABELS } from "@/types/financeiro";

export function DespesasCharts() {
  const { data: despesasPorCategoria } = useDespesasPorCategoria();

  const despesasChartData = despesasPorCategoria?.map(item => ({
    name: CATEGORIA_DESPESA_LABELS[item.categoria],
    value: item.total,
    percentual: item.percentual,
  }));

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={despesasChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.percentual?.toFixed(0) || 0}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {despesasChartData?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(value)}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
