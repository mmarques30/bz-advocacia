import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export function DespesasProjecaoTab() {
  const { data: evolucaoDespesas } = useQuery({
    queryKey: ["evolucao-despesas-mensal"],
    queryFn: async () => {
      const { data: despesas } = await supabase
        .from("despesas")
        .select("valor, data, status")
        .limit(10000);

      const { data: transacoes } = await supabase
        .from("transacoes_financeiras")
        .select("valor, data_transacao, tipo_codigo")
        .limit(10000);

      const hoje = new Date();
      const resultado = [];

      for (let i = 11; i >= 0; i--) {
        const data = subMonths(hoje, i);
        const inicio = startOfMonth(data);
        const fim = endOfMonth(data);

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

        resultado.push({
          mes: format(data, "MMM/yy", { locale: ptBR }),
          despesas: despesasMes + transacoesDespMes,
        });
      }

      return resultado;
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(value);

  const formatCurrencyFull = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  // Calcular média
  const media = evolucaoDespesas && evolucaoDespesas.length > 0
    ? evolucaoDespesas.reduce((sum, d) => sum + d.despesas, 0) / evolucaoDespesas.filter(d => d.despesas > 0).length || 0
    : 0;

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
              Últimos 12 meses • Média: {formatCurrencyFull(media)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {evolucaoDespesas && evolucaoDespesas.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={evolucaoDespesas} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip
                  formatter={(value: number) => [formatCurrencyFull(value), "Despesas"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend formatter={() => "Despesas"} />
                <Bar dataKey="despesas" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
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
