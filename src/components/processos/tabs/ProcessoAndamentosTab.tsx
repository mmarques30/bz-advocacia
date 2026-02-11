import { Button } from "@/components/ui/button";
import { Plus, Gavel, FileText, Scale, MessageSquare, Clock } from "lucide-react";
import { useProcessoAndamentos } from "@/hooks/useProcessoAndamentos";
import { TIPO_ANDAMENTO_LABELS } from "@/types/processos";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { AddAndamentoDialog } from "../AddAndamentoDialog";

const tipoIcon: Record<string, React.ReactNode> = {
  audiencia: <Gavel className="h-4 w-4" />,
  decisao: <Scale className="h-4 w-4" />,
  peticao: <FileText className="h-4 w-4" />,
  despacho: <MessageSquare className="h-4 w-4" />,
};

interface ProcessoAndamentosTabProps {
  processoId: string;
}

export function ProcessoAndamentosTab({ processoId }: ProcessoAndamentosTabProps) {
  const { data: andamentos, isLoading } = useProcessoAndamentos(processoId);
  const [showAddDialog, setShowAddDialog] = useState(false);

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando andamentos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Timeline de Andamentos</h3>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Andamento
        </Button>
      </div>

      {!andamentos || andamentos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum andamento registrado
        </div>
      ) : (
        <div className="relative pl-6">
          {/* Vertical timeline line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

          <div className="space-y-4">
            {andamentos.map((andamento) => (
              <div key={andamento.id} className="relative border rounded-lg p-4">
                {/* Timeline dot */}
                <div className="absolute -left-6 top-4 h-5 w-5 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                  {tipoIcon[andamento.tipo_andamento] || <Clock className="h-3 w-3" />}
                </div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {TIPO_ANDAMENTO_LABELS[andamento.tipo_andamento]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(andamento.data_andamento), "dd/MM/yyyy")}
                    </span>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{andamento.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <AddAndamentoDialog
        processoId={processoId}
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />
    </div>
  );
}
