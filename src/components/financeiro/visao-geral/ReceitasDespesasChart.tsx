import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReceitasDespesasMensal } from "@/hooks/useVisaoGeralFinanceiro";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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

// Brand colors from design tokens
const COLOR_RECEITAS = "hsl(142, 76%, 36%)";     // chart-4 (verde/success)
const COLOR_DESPESAS = "hsl(0, 84.2%, 60.2%)";   // destructive
const COLOR_RESULTADO = "hsl(30, 33%, 55%)";      // primary/bronze

export function ReceitasDespesasChart({ ano }: Props) {
  const { data, isLoading } = useReceitasDespesasMensal(ano);

  if (isLoading) return <Skeleton className="h-80" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Receitas × Despesas por Mês</CardTitle>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: COLOR_RECEITAS }} /> Receitas
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: COLOR_DESPESAS }} /> Despesas PJ
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: COLOR_RESULTADO }} /> Resultado
          </span>
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
              contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(0, 0%, 90%)" }}
            />
            <Bar dataKey="receitas" fill={COLOR_RECEITAS} radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" fill={COLOR_DESPESAS} radius={[4, 4, 0, 0]} />
            <Bar dataKey="resultado" fill={COLOR_RESULTADO} radius={[4, 4, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
