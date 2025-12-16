import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useTransacoesExternas, useResumoMensalExterno } from "@/hooks/useTransacoesExternas";

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

interface FinanceiroExternoChartsProps {
  ano?: number;
}

export function FinanceiroExternoCharts({ ano }: FinanceiroExternoChartsProps) {
  const currentYear = ano || new Date().getFullYear();
  const { data: transacoes } = useTransacoesExternas({ ano: currentYear });
  const { data: resumoMensal } = useResumoMensalExterno(currentYear);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Monthly data for bar chart
  const dadosMensais = resumoMensal?.map(r => ({
    mes: r.mes_nome || `Mês ${r.mes}`,
    receitas: Number(r.total_receitas) || 0,
    despesas: Number(r.total_despesas) || 0,
    saldo: Number(r.saldo) || 0,
  })) || [];

  // By subcategory (partners)
  const receitasPorSubcategoria: Record<string, number> = {};
  transacoes?.filter(t => t.tipo === 'receita').forEach(t => {
    const sub = t.subcategoria || 'outros';
    receitasPorSubcategoria[sub] = (receitasPorSubcategoria[sub] || 0) + Number(t.valor);
  });

  const dadosSubcategoria = Object.entries(receitasPorSubcategoria)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // By category (PF/PJ)
  const receitasPorCategoria: Record<string, number> = {};
  transacoes?.filter(t => t.tipo === 'receita').forEach(t => {
    const cat = t.categoria?.toUpperCase() || 'OUTROS';
    receitasPorCategoria[cat] = (receitasPorCategoria[cat] || 0) + Number(t.valor);
  });

  const dadosCategoria = Object.entries(receitasPorCategoria)
    .map(([name, value]) => ({ name, value }));

  // Cumulative revenue evolution
  const evolucaoReceitas = dadosMensais.reduce((acc, item, index) => {
    const acumulado = index > 0 ? acc[index - 1].acumulado + item.receitas : item.receitas;
    acc.push({ ...item, acumulado });
    return acc;
  }, [] as Array<typeof dadosMensais[0] & { acumulado: number }>);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receitas vs Despesas por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosMensais}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-xs" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="receitas" name="Receitas" fill="#10b981" />
              <Bar dataKey="despesas" name="Despesas" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receitas por Sócio/Subcategoria</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dadosSubcategoria}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {dadosSubcategoria.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receitas por Categoria (PF/PJ)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dadosCategoria}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {dadosCategoria.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução Acumulada de Receitas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolucaoReceitas}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-xs" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="acumulado" name="Acumulado" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="receitas" name="Mensal" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
