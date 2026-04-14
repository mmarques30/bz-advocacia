import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParcelasProximas } from "@/hooks/useVisaoGeralFinanceiro";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function ParcelasProximasWidget() {
  const [conta, setConta] = useState("todas");
  const { data: parcelas, isLoading } = useParcelasProximas(conta);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Parcelas Pendentes</CardTitle>
        <Select value={conta} onValueChange={setConta}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="eliziane">Eliziane</SelectItem>
            <SelectItem value="juliana">Juliana</SelectItem>
            <SelectItem value="escritorio">Escritório</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : !parcelas || parcelas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma parcela pendente</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {parcelas.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{p.cliente_nome}</p>
                  <p className="text-xs text-muted-foreground">
                    Parcela {p.numero_parcela} · {format(new Date(p.data_vencimento + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold">{fmt(p.valor)}</span>
                  <Badge variant={p.status === "atrasado" ? "destructive" : "secondary"} className="text-xs">
                    {p.status === "atrasado" ? "Atrasado" : "Pendente"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
