import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { useProcessoPrazos, useTogglePrazoCumprido } from "@/hooks/useProcessoPrazos";
import { PRIORIDADE_LABELS, TIPO_PRAZO_LABELS } from "@/types/processos";
import { format, differenceInDays } from "date-fns";
import { useState } from "react";
import { AddPrazoDialog } from "../AddPrazoDialog";
import { cn } from "@/lib/utils";

interface ProcessoPrazosTabProps {
  processoId: string;
}

export function ProcessoPrazosTab({ processoId }: ProcessoPrazosTabProps) {
  const { data: prazos, isLoading } = useProcessoPrazos(processoId);
  const toggleCumprido = useTogglePrazoCumprido();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filter, setFilter] = useState<"todos" | "pendentes" | "cumpridos" | "vencidos">("todos");

  const getPrazoStatus = (dataPrazo: string, status: string) => {
    const hoje = new Date();
    const prazo = new Date(dataPrazo);
    const dias = differenceInDays(prazo, hoje);

    if (status === "cumprido") return { cor: "default", texto: "Cumprido" };
    if (status === "cancelado") return { cor: "secondary", texto: "Cancelado" };
    if (dias < 0) return { cor: "destructive", texto: `Vencido há ${Math.abs(dias)} dias` };
    if (dias === 0) return { cor: "destructive", texto: "Vence hoje!" };
    if (dias <= 3) return { cor: "destructive", texto: `${dias} dias restantes` };
    if (dias <= 7) return { cor: "default", texto: `${dias} dias restantes` };
    return { cor: "secondary", texto: `${dias} dias restantes` };
  };

  const filteredPrazos = prazos?.filter((prazo) => {
    const status = getPrazoStatus(prazo.data_prazo, prazo.status);
    
    if (filter === "pendentes") return prazo.status === "pendente";
    if (filter === "cumpridos") return prazo.status === "cumprido";
    if (filter === "vencidos") {
      const dias = differenceInDays(new Date(prazo.data_prazo), new Date());
      return dias < 0 && prazo.status === "pendente";
    }
    return true;
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando prazos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={filter === "todos" ? "default" : "outline"}
            onClick={() => setFilter("todos")}
          >
            Todos
          </Button>
          <Button
            size="sm"
            variant={filter === "pendentes" ? "default" : "outline"}
            onClick={() => setFilter("pendentes")}
          >
            Pendentes
          </Button>
          <Button
            size="sm"
            variant={filter === "cumpridos" ? "default" : "outline"}
            onClick={() => setFilter("cumpridos")}
          >
            Cumpridos
          </Button>
          <Button
            size="sm"
            variant={filter === "vencidos" ? "default" : "outline"}
            onClick={() => setFilter("vencidos")}
          >
            Vencidos
          </Button>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Prazo
        </Button>
      </div>

      {!filteredPrazos || filteredPrazos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum prazo encontrado
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPrazos.map((prazo) => {
            const status = getPrazoStatus(prazo.data_prazo, prazo.status);
            
            return (
              <div key={prazo.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={prazo.status === "cumprido"}
                    onCheckedChange={(checked) =>
                      toggleCumprido.mutate({ id: prazo.id, cumprido: !!checked })
                    }
                    disabled={toggleCumprido.isPending}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn(
                        "font-medium",
                        prazo.status === "cumprido" && "line-through text-muted-foreground"
                      )}>
                        {prazo.descricao}
                      </h4>
                      <Badge variant={status.cor as any}>{status.texto}</Badge>
                      <Badge variant="outline">
                        {TIPO_PRAZO_LABELS[prazo.tipo_prazo]}
                      </Badge>
                      <Badge variant="secondary">
                        {PRIORIDADE_LABELS[prazo.prioridade]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Data: {format(new Date(prazo.data_prazo), "dd/MM/yyyy")}</span>
                      {prazo.observacoes && (
                        <span className="text-xs">{prazo.observacoes}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddPrazoDialog
        processoId={processoId}
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />
    </div>
  );
}
