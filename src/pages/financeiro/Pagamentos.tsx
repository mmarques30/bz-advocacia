import { Card, CardContent } from "@/components/ui/card";
import { PagamentosAtrasados } from "@/components/financeiro/pagamentos/PagamentosAtrasados";
import { ProximosVencimentos } from "@/components/financeiro/pagamentos/ProximosVencimentos";
import { useDespesasAtrasadas, useReceitasPendentes, useProximosVencimentos } from "@/hooks/usePagamentos";
import { AlertTriangle, TrendingUp, Wallet } from "lucide-react";

export default function FinanceiroPagamentos() {
  const { data: despesas = [] } = useDespesasAtrasadas();
  const { data: receitas = [] } = useReceitasPendentes();
  const { data: vencimentos = [] } = useProximosVencimentos(30);

  const totalPagar = despesas.reduce((sum, d) => sum + d.valor, 0) +
    vencimentos.filter(v => v.tipo === "despesa").reduce((sum, v) => sum + v.valor, 0);
  const totalReceber = receitas.reduce((sum, r) => sum + r.valor, 0) +
    vencimentos.filter(v => v.tipo === "receita").reduce((sum, v) => sum + v.valor, 0);
  const saldo = totalReceber - totalPagar;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestão de Pagamentos</h1>
        <p className="text-muted-foreground">
          Acompanhe vencimentos, atrasos e pagamentos pendentes
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total a Pagar</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(totalPagar)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 rounded-lg bg-chart-4/10">
              <TrendingUp className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total a Receber</p>
              <p className="text-xl font-bold text-chart-4">{formatCurrency(totalReceber)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`p-2 rounded-lg ${saldo >= 0 ? 'bg-chart-4/10' : 'bg-primary/10'}`}>
              <Wallet className={`h-5 w-5 ${saldo >= 0 ? 'text-chart-4' : 'text-primary'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Projetado</p>
              <p className={`text-xl font-bold ${saldo >= 0 ? 'text-chart-4' : 'text-primary'}`}>
                {formatCurrency(saldo)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <PagamentosAtrasados />

      <ProximosVencimentos dias={30} />
    </div>
  );
}
