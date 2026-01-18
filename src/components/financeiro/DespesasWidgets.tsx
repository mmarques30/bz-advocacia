import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDespesasRecentes } from "@/hooks/useDespesas";
import { Receipt } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CATEGORIA_DESPESA_LABELS, STATUS_DESPESA_LABELS } from "@/types/financeiro";
import type { DespesasGlobalFiltersState } from "./DespesasGlobalFilters";

interface DespesasWidgetsProps {
  filters?: DespesasGlobalFiltersState;
}

export function DespesasWidgets({ filters }: DespesasWidgetsProps) {
  const { data: despesasRecentes } = useDespesasRecentes(filters);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pago':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'atrasado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Despesas Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {despesasRecentes?.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma despesa registrada</p>
          ) : (
            despesasRecentes?.map((despesa) => (
              <div key={despesa.id} className="border-b pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{despesa.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORIA_DESPESA_LABELS[despesa.categoria]} • {format(new Date(despesa.data), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(despesa.status)} className="ml-2">
                    {STATUS_DESPESA_LABELS[despesa.status]}
                  </Badge>
                </div>
                <p className="text-sm font-semibold mt-1">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesa.valor)}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
