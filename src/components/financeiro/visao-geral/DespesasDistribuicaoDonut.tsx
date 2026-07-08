import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useDespesasPorCategoria } from "@/hooks/useDespesas";
import { getDefaultDespesasGlobalFilters, type DespesasGlobalFiltersState } from "../DespesasGlobalFilters";

// Paleta usa tokens B&Z + hues complementares. Cobre as principais categorias
// resolvidas por resolveCategoriaLabel; qualquer nome fora daqui usa "Outros".
const PALETTE: Record<string, string> = {
  "Aluguel e Condomínio": "hsl(30, 33%, 55%)",
  "Salários/Encargos": "hsl(72, 6%, 18%)",
  "Honorários de Terceiros": "hsl(200, 30%, 45%)",
  "Marketing/Publicidade": "hsl(30, 33%, 42%)",
  "Marketing": "hsl(30, 33%, 42%)",
  "Materiais de Expediente": "hsl(45, 25%, 50%)",
  "Telefonia/Internet": "hsl(220, 4%, 40%)",
  "Internet": "hsl(220, 4%, 40%)",
  "Software/Licenças": "hsl(260, 30%, 50%)",
  "Energia/Água": "hsl(190, 50%, 45%)",
  "Energia": "hsl(190, 50%, 45%)",
  "Impostos/Taxas": "hsl(0, 84.2%, 60.2%)",
  "Impostos": "hsl(0, 84.2%, 60.2%)",
  "Cartão de Crédito": "hsl(38, 92%, 50%)",
  "Aluguel": "hsl(30, 33%, 55%)",
  "Folha de Pagamento": "hsl(72, 6%, 18%)",
  "Tecnologia/IA": "hsl(220, 4%, 40%)",
  "Outros": "hsl(0, 0%, 65%)",
};

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

interface Props {
  ano: number | null;
  mes: number | null;
}

/**
 * Donut de distribuicao percentual de despesas no periodo selecionado.
 * Complementa o bar chart existente: bar mostra magnitudes, donut mostra
 * proporcao (util pra ver "onde ta a maior parte da grana").
 */
export function DespesasDistribuicaoDonut({ ano, mes }: Props) {
  const filtro: DespesasGlobalFiltersState = useMemo(() => {
    const base = getDefaultDespesasGlobalFilters();
    if (ano && mes) {
      // Recorte do mes selecionado.
      const inicio = new Date(ano, mes - 1, 1);
      const fim = new Date(ano, mes, 0);
      return { ...base, dataInicio: inicio, dataFim: fim, periodo: "personalizado" };
    }
    if (ano) {
      const inicio = new Date(ano, 0, 1);
      const fim = new Date(ano, 11, 31);
      return { ...base, dataInicio: inicio, dataFim: fim, periodo: "ano_atual" };
    }
    return base;
  }, [ano, mes]);

  const { data, isLoading } = useDespesasPorCategoria(filtro);

  if (isLoading) return <Skeleton className="h-80" />;

  const chartData = (data ?? []).map((d) => ({
    categoria: d.categoria,
    valor: d.total,
    pct: d.percentual,
  }));

  const totalPeriodo = chartData.reduce((s, d) => s + d.valor, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {mes && ano ? `Distribuição do mês (${String(mes).padStart(2, "0")}/${ano})` : "Distribuição de despesas"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            Sem despesas lançadas no período
          </div>
        ) : (
          <div className="relative">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="valor"
                  nameKey="categoria"
                  stroke="none"
                >
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={PALETTE[d.categoria] ?? PALETTE["Outros"]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, _name, entry: any) => [
                    `${brl(value)} (${entry?.payload?.pct?.toFixed(1)}%)`,
                    entry?.payload?.categoria ?? "",
                  ]}
                  contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(0, 0%, 90%)" }}
                />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value: string) => value}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="text-lg font-bold">{brl(totalPeriodo)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
