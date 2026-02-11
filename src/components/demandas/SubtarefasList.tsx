import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, User, Scale } from "lucide-react";
import { useSubtarefas, useUpdateSubtarefaStatus } from "@/hooks/useSubtarefas";
import { ADVOGADA_LABELS, STATUS_LABELS } from "@/types/demandas";
import { useState } from "react";
import { NewSubtarefaDialog } from "./NewSubtarefaDialog";
import { Demanda } from "@/types/demandas";

interface SubtarefasListProps {
  parentDemanda: Demanda;
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pendente: 'secondary',
  em_andamento: 'default',
  concluido: 'outline',
  cancelado: 'destructive',
};

export const SubtarefasList = ({ parentDemanda }: SubtarefasListProps) => {
  const { data: subtarefas, isLoading } = useSubtarefas(parentDemanda.id);
  const updateStatus = useUpdateSubtarefaStatus();
  const [showNewDialog, setShowNewDialog] = useState(false);

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando subtarefas...</p>;

  const total = subtarefas?.length || 0;
  const concluidas = subtarefas?.filter(s => s.status === 'concluido').length || 0;
  const progressPercent = total > 0 ? (concluidas / total) * 100 : 0;

  const handleToggle = (subtarefa: Demanda) => {
    const newStatus = subtarefa.status === 'concluido' ? 'pendente' : 'concluido';
    updateStatus.mutate({
      id: subtarefa.id,
      status: newStatus,
      parentId: parentDemanda.id,
    });
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Subtarefas ({concluidas}/{total})</h4>
        <Button size="sm" variant="outline" onClick={() => setShowNewDialog(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Subtarefa
        </Button>
      </div>

      {total > 0 && (
        <Progress value={progressPercent} className="h-2" />
      )}

      {total === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-3">
          Nenhuma subtarefa. Clique em "Subtarefa" para adicionar.
        </p>
      ) : (
        <div className="space-y-2">
          {subtarefas?.map((sub, idx) => (
            <div
              key={sub.id}
              className="flex items-center gap-3 rounded-md border px-3 py-2"
            >
              <Checkbox
                checked={sub.status === 'concluido'}
                onCheckedChange={() => handleToggle(sub)}
                disabled={updateStatus.isPending}
              />
              <span className="text-xs text-muted-foreground font-mono w-5">{sub.ordem ?? idx + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${sub.status === 'concluido' ? 'line-through text-muted-foreground' : ''}`}>
                  {sub.titulo}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Scale className="h-3 w-3" />
                    {ADVOGADA_LABELS[sub.advogada_responsavel as keyof typeof ADVOGADA_LABELS]}
                  </span>
                  {sub.responsavel?.nome_completo && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {sub.responsavel.nome_completo}
                    </span>
                  )}
                </div>
              </div>
              <Badge variant={statusVariant[sub.status]} className="text-[10px]">
                {STATUS_LABELS[sub.status]}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <NewSubtarefaDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        parentDemanda={parentDemanda}
        nextOrdem={(subtarefas?.length || 0) + 1}
      />
    </div>
  );
};
