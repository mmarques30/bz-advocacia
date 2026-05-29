import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth, addMonths, differenceInCalendarMonths, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

interface DespesasProjecaoTabProps {
  selectedMes?: string | null;
  onSelectMonth?: (mes: string) => void;
  dateRange?: DateRange;
}

/**
 * Calcula a janela de meses a exibir no grafico com base no filtro global.
 * - Ano inteiro (jan->dez): mostra os 12 meses do ano.
 * - Intervalo custom: mostra mes a mes entre `from` e `to` (max 24).
 * - Sem filtro: ultimos 12 meses corridos a partir de hoje.
 */
function getMonthsWindow(dateRange?: DateRange): { inicio: Date; fim: Date }[] {
  const meses: { inicio: Date; fim: Date }[] = [];

  if (dateRange?.from && dateRange?.to) {
    const from = startOfMonth(dateRange.from);
    const to = endOfMonth(dateRange.to);
    const total = Math.min(differenceInCalendarMonths(to, from) + 1, 24);
    for (let i = 0; i < total; i++) {
      const d = addMonths(from, i);
      meses.push({ inicio: startOfMonth(d), fim: endOfMonth(d) });
    }
    return meses;
  }

  const hoje = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = subMonths(hoje, i);
    meses.push({ inicio: startOfMonth(d), fim: endOfMonth(d) });
  }
  return meses;
}

function getPeriodoLabel(dateRange?: DateRange): string {
  if (!dateRange?.from || !dateRange?.to) return "Últimos 12 meses";
  const from = dateRange.from;
  const to = dateRange.to;
  const sameYear = from.getFullYear() === to.getFullYear();
  const isFullYear =
    sameYear &&
    isSameDay(from, new Date(from.getFullYear(), 0, 1)) &&
    isSameDay(to, new Date(from.getFullYear(), 11, 31));
  if (isFullYear) return `Ano de ${from.getFullYear()}`;
  return `${format(from, "MMM/yy", { locale: ptBR })} – ${format(to, "MMM/yy", { locale: ptBR })}`;
}

export function DespesasProjecaoTab({ selectedMes, onSelectMonth, dateRange }: DespesasProjecaoTabProps) {
  const rangeKey = dateRange?.from && dateRange?.to
    ? `${dateRange.from.toISOString()}_${dateRange.to.toISOString()}`
    : "rolling-12";

  const { data: evolucaoDespesas } = useQuery({
    queryKey: ["evolucao-despesas-mensal", rangeKey],
    queryFn: async () => {
      const { data: despesas } = await supabase
        .from("despesas")
        .select("valor, data, status")
        .limit(10000);

      const { data: transacoes } = await supabase
        .from("transacoes_financeiras")
        .select("valor, data_transacao, tipo_codigo")
        .limit(10000);

      const janela = getMonthsWindow(dateRange);

      return janela.map(({ inicio, fim }) => {
        const despesasMes = (despesas || [])
          .filter(d => {
            const dd = new Date(d.data);
            return dd >= inicio && dd <= fim;
          })
          .reduce((sum, d) => sum + Number(d.valor), 0);

        const transacoesDespMes = (transacoes || [])
          .filter(t => {
            if (!t.data_transacao) return false;
            const tipoDespesa = t.tipo_codigo === 'despesa' || t.tipo_codigo === 'DESP';
            if (!tipoDespesa) return false;
            const dt = new Date(t.data_transacao);
            return dt >= inicio && dt <= fim;
          })
          .reduce((sum, t) => sum + (t.valor || 0), 0);

        return {
          mes: format(inicio, "MMM/yy", { locale: ptBR }),
          mesKey: format(inicio, "yyyy-MM"),
          despesas: despesasMes + transacoesDespMes,
        };
      });
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(value);

  const formatCurrencyFull = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const mesesComValor = (evolucaoDespesas || []).filter(d => d.despesas > 0);
  const media = mesesComValor.length > 0
    ? mesesComValor.reduce((sum, d) => sum + d.despesas, 0) / mesesComValor.length
    : 0;

  const periodoLabel = getPeriodoLabel(dateRange);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Projeção de Despesas</h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Evolução Mensal de Despesas</span>
            <span className="text-xs font-normal text-muted-foreground">
              {onSelectMonth ? "Clique numa barra para filtrar • " : ""}{periodoLabel} • Média: {formatCurrencyFull(media)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {evolucaoDespesas && evolucaoDespesas.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={evolucaoDespesas}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                onClick={(state: any) => {
                  const mesKey = state?.activePayload?.[0]?.payload?.mesKey;
                  if (mesKey && onSelectMonth) onSelectMonth(mesKey);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip
                  formatter={(value: number) => [formatCurrencyFull(value), "Despesas"]}
                  cursor={{ fill: "hsl(var(--primary) / 0.08)" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend formatter={() => "Despesas"} />
                <Bar
                  dataKey="despesas"
                  radius={[4, 4, 0, 0]}
                  cursor={onSelectMonth ? "pointer" : undefined}
                >
                  {evolucaoDespesas.map((entry) => {
                    const isSelected = entry.mesKey === selectedMes;
                    const isDimmed = selectedMes && !isSelected;
                    return (
                      <Cell
                        key={entry.mesKey}
                        fill="hsl(var(--primary))"
                        opacity={isDimmed ? 0.35 : isSelected ? 1 : 0.85}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
