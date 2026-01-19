import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, DollarSign, Calendar } from "lucide-react";
import { useDespesasAtrasadas, useReceitasPendentes } from "@/hooks/usePagamentos";
import { format, differenceInDays } from "date-fns";

export function PagamentosAtrasados() {
  const { data: despesas = [], isLoading: loadingDespesas } = useDespesasAtrasadas();
  const { data: receitas = [], isLoading: loadingReceitas } = useReceitasPendentes();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getDiasAtraso = (dataVencimento: string) => {
    const dias = differenceInDays(new Date(), new Date(dataVencimento));
    return dias > 0 ? dias : 0;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Despesas Pendentes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary">
                <AlertTriangle className="h-5 w-5" />
                Despesas Pendentes
              </CardTitle>
              <CardDescription>
                {despesas.length} {despesas.length === 1 ? 'despesa' : 'despesas'} a pagar
              </CardDescription>
            </div>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
              {formatCurrency(despesas.reduce((sum, d) => sum + d.valor, 0))}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingDespesas ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : despesas.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">Nenhuma despesa pendente 🎉</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {despesas.map((despesa) => (
                  <div
                    key={despesa.id}
                    className="flex items-center justify-between p-3 border rounded-lg border-l-4 border-l-primary"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{despesa.descricao}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(despesa.data), "dd/MM/yyyy")}
                        {getDiasAtraso(despesa.data) > 0 && (
                          <Badge variant="outline" className="text-primary border-primary">
                            {getDiasAtraso(despesa.data)} dias
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-primary">
                      {formatCurrency(despesa.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Receitas a Receber */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <DollarSign className="h-5 w-5" />
                Receitas a Receber
              </CardTitle>
              <CardDescription>
                {receitas.length} {receitas.length === 1 ? 'parcela' : 'parcelas'} pendentes
              </CardDescription>
            </div>
            <Badge className="bg-chart-4/10 text-chart-4 hover:bg-chart-4/20">
              {formatCurrency(receitas.reduce((sum, r) => sum + r.valor, 0))}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingReceitas ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : receitas.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">Nenhuma receita pendente</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {receitas.map((parcela) => {
                  const diasAtraso = getDiasAtraso(parcela.data_vencimento);
                  const isAtrasado = diasAtraso > 0;
                  
                  return (
                    <div
                      key={parcela.id}
                      className={`flex items-center justify-between p-3 border rounded-lg border-l-4 ${
                        isAtrasado ? 'border-l-primary' : 'border-l-chart-4'
                      }`}
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-sm">
                          {parcela.cliente_nome || `Parcela ${parcela.numero_parcela}`}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(parcela.data_vencimento), "dd/MM/yyyy")}
                          {isAtrasado && (
                            <Badge variant="outline" className="text-primary border-primary">
                              {diasAtraso} dias de atraso
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className={`font-bold ${isAtrasado ? 'text-primary' : 'text-chart-4'}`}>
                        {formatCurrency(parcela.valor)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}