import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useResultadoMensal } from "@/hooks/useVisaoGeralFinanceiro";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

interface Props {
  ano: number | null;
}

export function ResultadoPeriodoCard({ ano }: Props) {
  const { data, isLoading } = useResultadoMensal(ano);

  if (isLoading) return <Skeleton className="h-64" />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Resultado do Período</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-emerald-50">
            <p className="text-xs text-muted-foreground">Receitas</p>
            <p className="text-lg font-bold text-emerald-600">{fmt(data.totalReceitas)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-50">
            <p className="text-xs text-muted-foreground">Despesas PJ</p>
            <p className="text-lg font-bold text-red-600">{fmt(data.totalDespesas)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-50">
            <p className="text-xs text-muted-foreground">Lucro</p>
            <p className={`text-lg font-bold ${data.lucro >= 0 ? "text-blue-600" : "text-red-600"}`}>
              {fmt(data.lucro)}
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data.dados}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => [fmt(v), "Resultado"]} />
            <Line type="monotone" dataKey="resultado" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>

        <p className="text-xs text-muted-foreground text-center">
          Melhor mês: <span className="font-medium text-foreground">{data.melhorMes.mes}</span> com{" "}
          <span className="font-medium text-emerald-600">{fmt(data.melhorMes.valor)}</span>
        </p>
      </CardContent>
    </Card>
  );
}
