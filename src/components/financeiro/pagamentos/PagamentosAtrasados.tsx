import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, DollarSign, Calendar, CheckCircle, Pencil, CreditCard } from "lucide-react";
import { useDespesasAtrasadas, useReceitasPendentes } from "@/hooks/usePagamentos";
import { useUpdateDespesa } from "@/hooks/useDespesas";
import { format, differenceInDays } from "date-fns";
import { DespesaDetailsDialog } from "@/components/financeiro/despesas/DespesaDetailsDialog";
import { RegistrarPagamentoDialog } from "@/components/financeiro/RegistrarPagamentoDialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function PagamentosAtrasados() {
  const { data: despesas = [], isLoading: loadingDespesas } = useDespesasAtrasadas();
  const { data: receitas = [], isLoading: loadingReceitas } = useReceitasPendentes();
  const updateDespesa = useUpdateDespesa();
  const queryClient = useQueryClient();

  const [editDespesaId, setEditDespesaId] = useState<string | null>(null);
  const [registrarParcelaId, setRegistrarParcelaId] = useState<string | null>(null);

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

  const handleMarcarPago = (despesa: { id: string; origem: string }) => {
    if (despesa.origem !== "despesas") {
      toast.info("Esta despesa é de transações e não pode ser marcada como paga aqui.");
      return;
    }
    updateDespesa.mutate(
      { id: despesa.id, status: "pago" as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["despesas-atrasadas"] });
          queryClient.invalidateQueries({ queryKey: ["proximos-vencimentos"] });
          toast.success("Despesa marcada como paga!");
        },
      }
    );
  };

  return (
    <>
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
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>Nenhuma despesa pendente</span>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {despesas.map((despesa) => (
                    <div
                      key={despesa.id}
                      className="flex items-center justify-between p-3 border rounded-lg border-l-4 border-l-primary"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{despesa.descricao}</p>
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
                      <div className="flex items-center gap-2 ml-2">
                        <span className="font-bold text-primary whitespace-nowrap">
                          {formatCurrency(despesa.valor)}
                        </span>
                        {despesa.origem === "despesas" && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              title="Marcar como pago"
                              onClick={() => handleMarcarPago(despesa)}
                            >
                              <CheckCircle className="h-4 w-4 text-chart-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              title="Editar despesa"
                              onClick={() => setEditDespesaId(despesa.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
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
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {parcela.cliente_nome || parcela.descricao || `Parcela ${parcela.numero_parcela}`}
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
                        <div className="flex items-center gap-2 ml-2">
                          <span className={`font-bold whitespace-nowrap ${isAtrasado ? 'text-primary' : 'text-chart-4'}`}>
                            {formatCurrency(parcela.valor)}
                          </span>
                          {parcela.origem === "parcelas" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              title="Registrar pagamento"
                              onClick={() => setRegistrarParcelaId(parcela.id)}
                            >
                              <CreditCard className="h-4 w-4 text-chart-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <DespesaDetailsDialog
        despesaId={editDespesaId}
        open={!!editDespesaId}
        onClose={() => setEditDespesaId(null)}
      />

      <RegistrarPagamentoDialog
        parcelaId={registrarParcelaId}
        open={!!registrarParcelaId}
        onClose={() => {
          setRegistrarParcelaId(null);
          queryClient.invalidateQueries({ queryKey: ["receitas-pendentes"] });
          queryClient.invalidateQueries({ queryKey: ["proximos-vencimentos"] });
        }}
      />
    </>
  );
}
