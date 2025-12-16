import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useResumoMensal, useResumoSubcategoria, useKPIsTransacoes } from "@/hooks/useTransacoesFinanceiras";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

const formatCurrencyFull = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function TransacoesCharts() {
  const { data: resumoMensal, isLoading: loadingMensal } = useResumoMensal(2025);
  const { data: resumoSubcat, isLoading: loadingSubcat } = useResumoSubcategoria(2025);
  const { data: kpis, isLoading: loadingKpis } = useKPIsTransacoes(2025);

  if (loadingMensal || loadingSubcat || loadingKpis) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Dados para gráfico PF vs PJ
  const pfVsPjData = [
    { name: "Pessoa Física", value: kpis?.receitasPF || 0 },
    { name: "Pessoa Jurídica", value: kpis?.receitasPJ || 0 },
  ];

  // Dados acumulados para linha
  let acumulado = 0;
  const dadosAcumulados = (resumoMensal || []).map((m) => {
    acumulado += m.resultado;
    return {
      mes: m.mes_nome.substring(0, 3),
      acumulado,
    };
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Evolução Mensal */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Receitas vs Despesas - 2025</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resumoMensal || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="mes_nome"
                tickFormatter={(v) => v.substring(0, 3)}
                className="text-xs"
              />
              <YAxis tickFormatter={formatCurrency} className="text-xs" />
              <Tooltip
                formatter={(value: number) => formatCurrencyFull(value)}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Legend />
              <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* PF vs PJ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Receitas: PF vs PJ</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pfVsPjData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {pfVsPjData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Por Subcategoria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Receitas por Sócia</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={resumoSubcat || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="total"
                nameKey="subcategoria_nome"
                label={({ subcategoria_nome, percentual }) =>
                  `${subcategoria_nome}: ${percentual.toFixed(0)}%`
                }
              >
                {(resumoSubcat || []).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resultado Acumulado */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Resultado Acumulado - 2025</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dadosAcumulados}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-xs" />
              <YAxis tickFormatter={formatCurrency} className="text-xs" />
              <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
              <Line
                type="monotone"
                dataKey="acumulado"
                name="Acumulado"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
