import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetaChartData, MetaCampanha } from "@/types/meta-ads";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useMemo } from "react";

interface Props {
  chartData: MetaChartData[];
  campanhas: MetaCampanha[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function MetaAdsVisaoGeralTab({ chartData, campanhas }: Props) {
  // Distribuicao por objective das campanhas (gasto soma).
  const objectiveData = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of campanhas) {
      const key = c.objetivo ?? "OUTROS";
      map.set(key, (map.get(key) ?? 0) + c.gasto);
    }
    return Array.from(map.entries())
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [campanhas]);

  const hasInsights = chartData.length > 0;
  const hasObjective = objectiveData.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Gasto + Leads ao longo do tempo (col span 2) */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Performance ao longo do tempo</CardTitle>
        </CardHeader>
        <CardContent>
          {hasInsights ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, name) =>
                    name === "Gasto" ? [fmtBRL(value), name] : [value, name]
                  }
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="gasto" name="Gasto" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="leads" name="Leads" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              Sem dados de performance ainda — aguardando o primeiro sync de insights.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Distribuicao por objetivo (donut) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Investimento por objetivo</CardTitle>
        </CardHeader>
        <CardContent>
          {hasObjective ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={objectiveData}
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  label={(entry) => entry.name}
                >
                  {objectiveData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmtBRL(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              Sem campanhas com gasto no período.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cliques diario (col span 3 — full width) */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">Gasto diário</CardTitle>
        </CardHeader>
        <CardContent>
          {hasInsights ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} />
                <Bar dataKey="gasto" name="Gasto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sem dados.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
