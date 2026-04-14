import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ArrowUpCircle, ArrowDownCircle, CheckCircle, CreditCard } from "lucide-react";
import { useProximosVencimentos } from "@/hooks/usePagamentos";
import { useUpdateDespesa } from "@/hooks/useDespesas";
import { RegistrarPagamentoDialog } from "@/components/financeiro/RegistrarPagamentoDialog";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/lib/toast";
import { useQueryClient } from "@tanstack/react-query";

interface ProximosVencimentosProps {
  dias?: number;
}

export function ProximosVencimentos({ dias = 7 }: ProximosVencimentosProps) {
  const { data: vencimentos = [], isLoading } = useProximosVencimentos(dias);
  const updateDespesa = useUpdateDespesa();
  const queryClient = useQueryClient();
  const [registrarParcelaId, setRegistrarParcelaId] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getDiasRestantes = (dataVencimento: string) => {
    const diasRestantes = differenceInDays(new Date(dataVencimento), new Date());
    if (diasRestantes === 0) return "Hoje";
    if (diasRestantes === 1) return "Amanhã";
    return `${diasRestantes} dias`;
  };

  const getColorByDias = (dataVencimento: string) => {
    const diasRestantes = differenceInDays(new Date(dataVencimento), new Date());
    if (diasRestantes <= 1) return "border-l-primary bg-primary/5";
    if (diasRestantes <= 3) return "border-l-secondary bg-secondary/5";
    return "border-l-muted bg-muted/30";
  };

  const handleMarcarDespesaPaga = (id: string, origem: string) => {
    if (origem !== "despesas") {
      toast.info("Esta despesa é de transações e não pode ser marcada como paga aqui.");
      return;
    }
    updateDespesa.mutate(
      { id, status: "pago" as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["proximos-vencimentos"] });
          queryClient.invalidateQueries({ queryKey: ["despesas-atrasadas"] });
          toast.success("Despesa marcada como paga!");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalReceitas = vencimentos
    .filter((v) => v.tipo === "receita")
    .reduce((sum, v) => sum + v.valor, 0);
  const totalDespesas = vencimentos
    .filter((v) => v.tipo === "despesa")
    .reduce((sum, v) => sum + v.valor, 0);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Próximos Vencimentos ({dias} dias)
              </CardTitle>
              <CardDescription>
                {vencimentos.length} {vencimentos.length === 1 ? 'item' : 'itens'} vencendo
              </CardDescription>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-chart-4" />
                <span className="text-sm font-medium text-chart-4">
                  {formatCurrency(totalReceitas)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {formatCurrency(totalDespesas)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {vencimentos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Nenhum vencimento nos próximos {dias} dias
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {vencimentos.map((item) => (
                <div
                  key={`${item.tipo}-${item.origem}-${item.id}`}
                  className={`p-4 border rounded-lg border-l-4 ${getColorByDias(item.data_vencimento)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge 
                      variant="outline"
                      className={item.tipo === "receita" 
                        ? "bg-chart-4/10 text-chart-4 border-chart-4/30" 
                        : "bg-primary/10 text-primary border-primary/30"
                      }
                    >
                      {item.tipo === "receita" ? "Receita" : "Despesa"}
                    </Badge>
                    <span className="text-xs font-medium text-muted-foreground">
                      {getDiasRestantes(item.data_vencimento)}
                    </span>
                  </div>
                  
                  <p className="font-medium text-sm truncate mb-1">
                    {item.descricao}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.data_vencimento), "dd MMM", { locale: ptBR })}
                    </span>
                    <span className={`font-bold ${
                      item.tipo === "receita" ? "text-chart-4" : "text-primary"
                    }`}>
                      {formatCurrency(item.valor)}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t">
                    {item.tipo === "despesa" && item.origem === "despesas" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs"
                        onClick={() => handleMarcarDespesaPaga(item.id, item.origem)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Pagar
                      </Button>
                    )}
                    {item.tipo === "receita" && item.origem === "parcelas" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs"
                        onClick={() => setRegistrarParcelaId(item.id)}
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Registrar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RegistrarPagamentoDialog
        parcelaId={registrarParcelaId}
        open={!!registrarParcelaId}
        onClose={() => {
          setRegistrarParcelaId(null);
          queryClient.invalidateQueries({ queryKey: ["proximos-vencimentos"] });
          queryClient.invalidateQueries({ queryKey: ["receitas-pendentes"] });
        }}
      />
    </>
  );
}
