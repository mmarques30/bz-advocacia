import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReceitasDespesasMensal } from "@/hooks/useVisaoGeralFinanceiro";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrencyShort = (v: number) => {
  if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`;
  return `R$${v.toFixed(0)}`;
};

const formatCurrencyFull = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Props {
  ano: number | null;
}

export function ReceitasDespesasChart({ ano }: Props) {
  const { data, isLoading } = useReceitasDespesasMensal(ano);

  if (isLoading) return <Skeleton className="h-80" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Receitas × Despesas por Mês</CardTitle>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Receitas</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Despesas PJ</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400/50 inline-block" /> Resultado</span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="mes" className="text-xs" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatCurrencyShort} className="text-xs" tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrencyFull(value),
                name === "receitas" ? "Receitas" : name === "despesas" ? "Despesas PJ" : "Resultado",
              ]}
            />
            <Bar dataKey="receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="resultado" fill="rgba(96, 165, 250, 0.5)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
