import { useProcessoHistorico } from "@/hooks/useProcessoHistorico";
import { format } from "date-fns";
import { Clock } from "lucide-react";

interface ProcessoHistoricoTabProps {
  processoId: string;
}

export function ProcessoHistoricoTab({ processoId }: ProcessoHistoricoTabProps) {
  const { data: historico, isLoading } = useProcessoHistorico(processoId);

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando histórico...</div>;
  }

  if (!historico || historico.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma alteração registrada
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {historico.map((item) => (
        <div key={item.id} className="border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{item.acao}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {item.entidade_tipo} • {item.campo_alterado}
              </p>
              {item.valor_anterior && item.valor_novo && (
                <div className="mt-2 text-sm">
                  <span className="text-muted-foreground">De: </span>
                  <span className="line-through">{item.valor_anterior}</span>
                  <span className="text-muted-foreground mx-2">→</span>
                  <span className="font-medium">{item.valor_novo}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
