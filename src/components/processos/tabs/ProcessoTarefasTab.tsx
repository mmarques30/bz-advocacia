import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Clock, CheckCircle2, AlertCircle, ChevronDown, ListTodo, Timer } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { NewDemandaDialog } from "@/components/demandas/NewDemandaDialog";
import { PRIORIDADE_LABELS, STATUS_LABELS } from "@/types/demandas";
import { useAdvogadaLabels } from "@/hooks/useAdvogadaLabels";

interface ProcessoTarefasTabProps {
  processoId: string;
}

const prioridadeColor: Record<string, string> = {
  baixa: "bg-muted text-muted-foreground",
  media: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  alta: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  urgente: "bg-destructive/10 text-destructive",
};

export function ProcessoTarefasTab({ processoId }: ProcessoTarefasTabProps) {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [concluidasOpen, setConcluidasOpen] = useState(false);

  const { data: tarefas, isLoading } = useQuery({
    queryKey: ["processo-tarefas", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demandas_internas")
        .select(`
          *,
          responsavel:profiles!demandas_internas_responsavel_id_fkey(nome_completo)
        `)
        .eq("processo_id", processoId)
        .is("parent_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando tarefas...</div>;
  }

  const pendentes = tarefas?.filter((t) => t.status === "pendente" || t.status === "em_andamento") || [];
  const concluidas = tarefas?.filter((t) => t.status === "concluido") || [];
  const totalHoras = tarefas?.reduce((sum, t) => sum + (Number(t.horas_gastas) || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tarefas do Processo</h3>
        <Button size="sm" onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Resumo de Esforço */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <ListTodo className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{tarefas?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Total de Tarefas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{concluidas.length}</p>
              <p className="text-xs text-muted-foreground">Concluídas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <Timer className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{totalHoras}h</p>
              <p className="text-xs text-muted-foreground">Horas Gastas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tarefas Pendentes/Em Andamento */}
      <div className="space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          Pendentes / Em Andamento ({pendentes.length})
        </h4>
        {pendentes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma tarefa pendente</p>
        ) : (
          <div className="space-y-2">
            {pendentes.map((tarefa) => (
              <Card key={tarefa.id}>
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{tarefa.titulo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {tarefa.advogada_responsavel && (
                        <span className="text-xs font-medium text-primary">
                          {ADVOGADA_LABELS[tarefa.advogada_responsavel as keyof typeof ADVOGADA_LABELS]}
                        </span>
                      )}
                      {tarefa.responsavel?.nome_completo && (
                        <span className="text-xs text-muted-foreground">{tarefa.responsavel.nome_completo}</span>
                      )}
                      {tarefa.data_limite && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(tarefa.data_limite), "dd/MM/yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant="outline" className={prioridadeColor[tarefa.prioridade] || ""}>
                      {PRIORIDADE_LABELS[tarefa.prioridade as keyof typeof PRIORIDADE_LABELS] || tarefa.prioridade}
                    </Badge>
                    <Badge variant="secondary">
                      {STATUS_LABELS[tarefa.status as keyof typeof STATUS_LABELS] || tarefa.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Tarefas Concluídas */}
      <Collapsible open={concluidasOpen} onOpenChange={setConcluidasOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Concluídas ({concluidas.length})
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${concluidasOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {concluidas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma tarefa concluída</p>
          ) : (
            concluidas.map((tarefa) => (
              <div key={tarefa.id} className="flex items-center justify-between border rounded-lg px-4 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-through text-muted-foreground truncate">{tarefa.titulo}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground ml-2">
                  {tarefa.horas_gastas ? <span>{tarefa.horas_gastas}h</span> : null}
                  {tarefa.data_conclusao && (
                    <span>{format(new Date(tarefa.data_conclusao), "dd/MM/yyyy")}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </CollapsibleContent>
      </Collapsible>

      <NewDemandaDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        defaultProcessoId={processoId}
      />
    </div>
  );
}
