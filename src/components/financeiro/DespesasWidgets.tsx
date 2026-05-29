import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDespesasRecentes } from "@/hooks/useDespesas";
import { Receipt, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { STATUS_DESPESA_LABELS } from "@/types/financeiro";
import { useCategoriasDespesa } from "@/hooks/useCategoriasDespesa";
import type { DespesasGlobalFiltersState } from "./DespesasGlobalFilters";

interface DespesasWidgetsProps {
  filters?: DespesasGlobalFiltersState;
}

const INITIAL_ITEMS = 3;

export function DespesasWidgets({ filters }: DespesasWidgetsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: despesasRecentes } = useDespesasRecentes(filters);
  const { getLabel: getCategoriaLabel } = useCategoriasDespesa();


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

  // Mostrar 3 itens inicialmente ou todos se expandido
  const despesasExibidas = isExpanded 
    ? despesasRecentes 
    : despesasRecentes?.slice(0, INITIAL_ITEMS);

  const temMaisItens = (despesasRecentes?.length || 0) > INITIAL_ITEMS;
  const itensRestantes = (despesasRecentes?.length || 0) - INITIAL_ITEMS;

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
            <>
              {despesasExibidas?.map((despesa) => (
                <div key={despesa.id} className="border-b pb-2 last:border-b-0">
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
              ))}

              {/* Botão Expandir/Ocultar */}
              {temMaisItens && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full mt-2 text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Ver mais ({itensRestantes} restantes)
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
