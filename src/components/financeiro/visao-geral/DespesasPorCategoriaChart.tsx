import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDespesasPorCategoria } from "@/hooks/useVisaoGeralFinanceiro";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS: Record<string, string> = {
  "Aluguel": "#6366f1",
  "Cartão de Crédito": "#f59e0b",
  "Tecnologia/IA": "#06b6d4",
  "Marketing": "#ec4899",
  "Impostos": "#ef4444",
  "Folha de Pagamento": "#8b5cf6",
  "Outros": "#94a3b8",
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

interface Props {
  ano: number | null;
}

export function DespesasPorCategoriaChart({ ano }: Props) {
  const { data, isLoading } = useDespesasPorCategoria(ano);

  if (isLoading) return <Skeleton className="h-80" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" barSize={20}>
            <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="categoria" width={120} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => [formatCurrency(v), "Total"]} />
            <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
              {data?.map((entry, idx) => (
                <Cell key={idx} fill={COLORS[entry.categoria] || COLORS["Outros"]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
