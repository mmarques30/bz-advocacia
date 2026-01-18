import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParcelasVencendo, useClientesInadimplentes, useMaioresPagadores } from "@/hooks/useFinanceiro";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { FaturamentoFiltersState } from "./FaturamentoFilters";

interface FaturamentoWidgetsProps {
  onRegistrarPagamento?: (parcelaId: string) => void;
  filters?: FaturamentoFiltersState;
}

export function FaturamentoWidgets({ onRegistrarPagamento, filters }: FaturamentoWidgetsProps) {
  const { data: parcelasVencendo } = useParcelasVencendo(7);
  const { data: inadimplentes } = useClientesInadimplentes();
  const { data: maioresPagadores } = useMaioresPagadores(5);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Parcelas Vencendo (7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {parcelasVencendo?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma parcela vencendo</p>
            ) : (
              parcelasVencendo?.slice(0, 5).map((parcela) => (
                <div key={parcela.id} className="flex items-center justify-between border-b pb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{parcela.cliente_nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Parcela {parcela.numero_parcela} - {format(new Date(parcela.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parcela.valor)}
                    </p>
                  </div>
                  <Badge variant={parcela.dias_restantes <= 3 ? "destructive" : "secondary"}>
                    {parcela.dias_restantes}d
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Clientes Inadimplentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {inadimplentes?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum cliente inadimplente</p>
            ) : (
              inadimplentes?.slice(0, 5).map((cliente) => (
                <div key={cliente.cliente_id} className="border-b pb-2">
                  <p className="text-sm font-medium">{cliente.cliente_nome}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      {cliente.parcelas_atrasadas} parcela(s) atrasada(s)
                    </p>
                    <Badge variant="destructive">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cliente.total_atrasado)}
                    </Badge>
                  </div>
                  <p className="text-xs text-destructive mt-1">
                    Maior atraso: {cliente.maior_atraso_dias} dias
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Maiores Pagadores do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {maioresPagadores?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pagamento no mês</p>
            ) : (
              maioresPagadores?.map((pagador, index) => (
                <div key={pagador.cliente_id} className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{pagador.cliente_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {pagador.quantidade_pagamentos} pagamento(s)
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pagador.total_pago)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
