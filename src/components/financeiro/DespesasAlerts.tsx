import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Clock } from "lucide-react";
import { useDespesas } from "@/hooks/useDespesas";
import { isPast, isWithinInterval, addDays } from "date-fns";

export function DespesasAlerts() {
  const { data: despesas } = useDespesas({ status: ['pendente'] });

  const hoje = new Date();
  const seteDiasFrente = addDays(hoje, 7);

  const despesasAtrasadas = despesas?.filter(d => 
    d.status === 'pendente' && isPast(new Date(d.data))
  ) || [];

  const despesasVencendo = despesas?.filter(d => 
    d.status === 'pendente' && 
    !isPast(new Date(d.data)) &&
    isWithinInterval(new Date(d.data), { start: hoje, end: seteDiasFrente })
  ) || [];

  if (despesasAtrasadas.length === 0 && despesasVencendo.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {despesasAtrasadas.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Despesas Atrasadas</AlertTitle>
          <AlertDescription>
            Você tem {despesasAtrasadas.length} despesa(s) pendente(s) com vencimento passado.
            Valor total: {new Intl.NumberFormat('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            }).format(despesasAtrasadas.reduce((sum, d) => sum + d.valor, 0))}
          </AlertDescription>
        </Alert>
      )}

      {despesasVencendo.length > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Despesas a Vencer</AlertTitle>
          <AlertDescription>
            Você tem {despesasVencendo.length} despesa(s) que vencem nos próximos 7 dias.
            Valor total: {new Intl.NumberFormat('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            }).format(despesasVencendo.reduce((sum, d) => sum + d.valor, 0))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
