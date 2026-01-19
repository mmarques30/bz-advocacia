import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Clock, DollarSign, TrendingUp } from "lucide-react";
import { useKPIsPagamentos } from "@/hooks/usePagamentos";

export function PagamentosKPIs() {
  const { data: kpis, isLoading } = useKPIsPagamentos();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Despesas Atrasadas</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(kpis?.despesas_atrasadas || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {kpis?.quantidade_despesas_atrasadas || 0} despesas pendentes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Receitas Pendentes</CardTitle>
          <DollarSign className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {formatCurrency(kpis?.receitas_pendentes || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {kpis?.quantidade_receitas_pendentes || 0} parcelas a receber
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Vencendo em 7 Dias</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(kpis?.vencendo_7_dias || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {kpis?.quantidade_vencendo_7_dias || 0} itens próximos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Saldo a Pagar/Receber</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${(kpis?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(kpis?.saldo || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Receitas - Despesas pendentes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
