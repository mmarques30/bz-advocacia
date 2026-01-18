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
import { useResumoMensal, useKPIsTransacoes, useResumoAnual, useReceitasPorResponsavel } from "@/hooks/useTransacoesFinanceiras";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

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

import type { TransacoesFilters } from "@/types/transacoes";

interface TransacoesChartsProps {
  filters?: TransacoesFilters;
}

export function TransacoesCharts({ filters }: TransacoesChartsProps) {
  // Determinar se temos um ano específico ou se é "tudo"
  const hasYearFilter = filters?.ano !== undefined;
  const hasDateRange = filters?.dataInicio && filters?.dataFim;
  const anoSelecionado = filters?.ano || new Date().getFullYear();
  
  const { data: resumoMensal, isLoading: loadingMensal } = useResumoMensal(
    hasYearFilter ? { ...filters, ano: anoSelecionado } : { ano: new Date().getFullYear() }
  );
  const { data: resumoAnual, isLoading: loadingAnual } = useResumoAnual();
  const { data: receitasResponsavel, isLoading: loadingResponsavel } = useReceitasPorResponsavel(filters);
  const { data: kpis, isLoading: loadingKpis } = useKPIsTransacoes(filters || {});

  const isLoading = loadingMensal || loadingKpis || loadingAnual || loadingResponsavel;

  if (isLoading) {
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

  // Gerar título dinâmico
  const getChartTitle = (base: string) => {
    if (filters?.dataInicio && filters?.dataFim) {
      return `${base} - ${filters.dataInicio.toLocaleDateString('pt-BR')} a ${filters.dataFim.toLocaleDateString('pt-BR')}`;
    }
    if (filters?.ano) {
      return `${base} - ${filters.ano}`;
    }
    return `${base} - Todos os anos`;
  };

  // Se não há filtro de ano específico nem range de datas, mostrar gráfico por ano
  const showYearlyChart = !hasYearFilter && !hasDateRange;

  // Dados acumulados para linha (quando há ano específico)
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
      {/* Gráfico principal: Por Ano (quando sem filtro) ou Por Mês (quando com ano) */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">
            {showYearlyChart 
              ? "Receitas vs Despesas por Ano" 
              : getChartTitle("Receitas vs Despesas")
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            {showYearlyChart ? (
              <BarChart data={resumoAnual || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="ano" className="text-xs" />
                <YAxis tickFormatter={formatCurrency} className="text-xs" />
                <Tooltip
                  formatter={(value: number) => formatCurrencyFull(value)}
                  labelFormatter={(label) => `Ano: ${label}`}
                />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
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
            )}
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

      {/* Receitas por Responsável */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Receitas por Responsável</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={receitasResponsavel || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="total"
                nameKey="responsavel"
                label={({ responsavel, percentual }) =>
                  `${responsavel}: ${percentual.toFixed(0)}%`
                }
              >
                {(receitasResponsavel || []).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resultado Acumulado - só mostrar quando tem ano específico */}
      {hasYearFilter && (
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Resultado Acumulado - {anoSelecionado}</CardTitle>
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
      )}
    </div>
  );
}