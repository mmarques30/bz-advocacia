import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDespesasPJPorCategoria } from "@/hooks/useVisaoGeralFinanceiro";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// Brand-aligned palette using design tokens and complementary hues.
// Cobre tanto labels legados (extraidos da descricao) quanto labels novos
// vindos de resolveCategoriaLabel (categorias contabeis pos-migration).
const COLORS: Record<string, string> = {
  // Legados (descricao parsing)
  "Aluguel": "hsl(30, 33%, 55%)",
  "Cartão de Crédito": "hsl(38, 92%, 50%)",
  "Tecnologia/IA": "hsl(220, 4%, 40%)",
  "Marketing": "hsl(30, 33%, 42%)",
  "Impostos": "hsl(0, 84.2%, 60.2%)",
  "Folha de Pagamento": "hsl(72, 6%, 18%)",
  // Codigos contabeis (resolveCategoriaLabel)
  "Aluguel e Condomínio": "hsl(30, 33%, 55%)",
  "Salários/Encargos": "hsl(72, 6%, 18%)",
  "Honorários de Terceiros": "hsl(200, 30%, 45%)",
  "Marketing/Publicidade": "hsl(30, 33%, 42%)",
  "Materiais de Expediente": "hsl(45, 25%, 50%)",
  "Telefonia/Internet": "hsl(220, 4%, 40%)",
  "Software/Licenças": "hsl(260, 30%, 50%)",
  "Energia/Água": "hsl(190, 50%, 45%)",
  "Impostos/Taxas": "hsl(0, 84.2%, 60.2%)",
  "Outros": "hsl(0, 0%, 65%)",
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

interface Props {
  ano: number | null;
}

export function DespesasPorCategoriaChart({ ano }: Props) {
  const { data, isLoading } = useDespesasPJPorCategoria(ano);

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
            <Tooltip
              formatter={(v: number) => [formatCurrency(v), "Total"]}
              contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(0, 0%, 90%)" }}
            />
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
