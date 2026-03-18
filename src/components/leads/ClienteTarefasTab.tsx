import { useDemandasByLead } from "@/hooks/useDemandas";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Demanda, ADVOGADA_LABELS } from "@/types/demandas";

interface ClienteTarefasTabProps {
  leadId: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  em_andamento: { label: "Em Andamento", className: "bg-blue-100 text-blue-800 border-blue-200" },
  concluido: { label: "Concluído", className: "bg-green-100 text-green-800 border-green-200" },
  cancelado: { label: "Cancelado", className: "bg-gray-100 text-gray-800 border-gray-200" },
};

const prioridadeConfig: Record<string, { label: string; className: string }> = {
  baixa: { label: "Baixa", className: "bg-slate-100 text-slate-700 border-slate-200" },
  media: { label: "Média", className: "bg-blue-50 text-blue-700 border-blue-200" },
  alta: { label: "Alta", className: "bg-orange-100 text-orange-800 border-orange-200" },
  urgente: { label: "Urgente", className: "bg-red-100 text-red-800 border-red-200" },
};

function TarefaItem({ demanda }: { demanda: Demanda }) {
  const status = statusConfig[demanda.status] || statusConfig.pendente;
  const prioridade = prioridadeConfig[demanda.prioridade] || prioridadeConfig.media;
  const isConcluida = demanda.status === "concluido";

  return (
    <div className={`p-3 border rounded-lg ${isConcluida ? "opacity-70 bg-muted/30" : "hover:bg-muted/50"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isConcluida ? "line-through text-muted-foreground" : ""}`}>
            {demanda.titulo}
          </p>
          {demanda.descricao && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{demanda.descricao}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge variant="outline" className={prioridade.className}>{prioridade.label}</Badge>
          <Badge variant="outline" className={status.className}>{status.label}</Badge>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
        <span>Resp: {demanda.advogada_responsavel || "—"}</span>
        {demanda.data_limite && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Prazo: {format(new Date(demanda.data_limite), "dd/MM/yyyy")}
          </span>
        )}
        {demanda.concluida_em && (
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            Concluída: {format(new Date(demanda.concluida_em), "dd/MM/yyyy")}
          </span>
        )}
      </div>
    </div>
  );
}

export function ClienteTarefasTab({ leadId }: ClienteTarefasTabProps) {
  const { data: demandas, isLoading } = useDemandasByLead(leadId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!demandas || demandas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nenhuma tarefa vinculada a este cliente</p>
      </div>
    );
  }

  const ativas = demandas.filter((d) => d.status !== "concluido" && d.status !== "cancelado");
  const concluidas = demandas.filter((d) => d.status === "concluido");
  const canceladas = demandas.filter((d) => d.status === "cancelado");

  return (
    <div className="space-y-6">
      {/* Tarefas Ativas */}
      {ativas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Tarefas Ativas ({ativas.length})
          </h3>
          <div className="space-y-2">
            {ativas.map((d) => <TarefaItem key={d.id} demanda={d} />)}
          </div>
        </div>
      )}

      {/* Tarefas Concluídas */}
      {concluidas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Concluídas ({concluidas.length})
          </h3>
          <div className="space-y-2">
            {concluidas.map((d) => <TarefaItem key={d.id} demanda={d} />)}
          </div>
        </div>
      )}

      {/* Canceladas */}
      {canceladas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            Canceladas ({canceladas.length})
          </h3>
          <div className="space-y-2">
            {canceladas.map((d) => <TarefaItem key={d.id} demanda={d} />)}
          </div>
        </div>
      )}
    </div>
  );
}
