import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { Lead, LeadStatus } from "@/types/leads";
import { LeadCard } from "./LeadCard";
import { useUpdateLeadStage, useDeleteLead } from "@/hooks/useLeads";
import { Skeleton } from "@/components/ui/skeleton";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const VALID_STAGES: string[] = ['novo', 'contato_inicial', 'em_analise', 'proposta_enviada', 'fechado', 'perdido'];

// Mapeamento: DB estágio → coluna visual unificada
const DB_TO_VISUAL: Record<string, string> = {
  novo: 'novo',
  contato_inicial: 'enviado',
  em_analise: 'qualificado',
  proposta_enviada: 'qualificado',
  fechado: 'convertido',
  perdido: 'perdido',
};

// Mapeamento: coluna visual → valor salvo no DB ao arrastar
const VISUAL_TO_DB: Record<string, string> = {
  novo: 'novo',
  enviado: 'contato_inicial',
  qualificado: 'em_analise',
  convertido: 'fechado',
  perdido: 'perdido',
};

interface LeadsKanbanProps {
  leads: Lead[] | undefined;
  isLoading: boolean;
  onViewDetails: (lead: Lead) => void;
  onAssumed?: (lead: Lead) => void;
}

function SortableLeadCard({ lead, onViewDetails, onAssumed, onDelete }: { lead: Lead; onViewDetails: (lead: Lead) => void; onAssumed?: (lead: Lead) => void; onDelete?: (lead: Lead) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} onClick={() => onViewDetails(lead)} onAssumed={onAssumed} onDelete={onDelete} />
    </div>
  );
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`p-2 space-y-2 max-h-[60vh] overflow-y-auto rounded-lg transition-colors ${
        isOver ? 'bg-accent/50 ring-2 ring-primary/30' : ''
      }`}
    >
      {children}
    </div>
  );
}

const columns: { id: string; titulo: string; color: string }[] = [
  { id: "novo", titulo: "Novo", color: "border-t-blue-500" },
  { id: "enviado", titulo: "Enviado", color: "border-t-green-500" },
  { id: "qualificado", titulo: "Qualificado", color: "border-t-purple-500" },
  { id: "convertido", titulo: "Convertido", color: "border-t-emerald-500" },
  { id: "perdido", titulo: "Perdido", color: "border-t-red-500" },
];

export function LeadsKanban({ leads, isLoading, onViewDetails, onAssumed }: LeadsKanbanProps) {
  const updateStage = useUpdateLeadStage();
  const deleteLead = useDeleteLead();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  // activationConstraint.distance: só inicia drag após mover 8px,
  // permitindo que clicks simples no card propaguem para abrir o detalhe.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const leadsGrouped = useMemo(() => {
    if (!leads) return {};

    return leads.reduce((acc, lead) => {
      const visualColumn = DB_TO_VISUAL[lead.estagio] || 'novo';
      if (!acc[visualColumn]) acc[visualColumn] = [];
      acc[visualColumn].push(lead);
      return acc;
    }, {} as Record<string, Lead[]>);
  }, [leads]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    let visualColumn: string;

    // Check if dropped on a column directly
    if (columns.some(c => c.id === overId)) {
      visualColumn = overId;
    } else {
      // Dropped on another lead card — resolve its visual column
      const leadAlvo = leads?.find((l) => l.id === overId);
      if (leadAlvo) {
        visualColumn = DB_TO_VISUAL[leadAlvo.estagio] || 'novo';
      } else {
        return;
      }
    }

    const dbEstagio = VISUAL_TO_DB[visualColumn];
    if (!dbEstagio) return;

    const lead = leads?.find((l) => l.id === leadId);
    if (!lead) return;

    if (lead.estagio === dbEstagio) return;

    updateStage.mutate({ id: leadId, estagio: dbEstagio });
  };

  const activeLead = activeId ? leads?.find((l) => l.id === activeId) : null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-4 min-h-[600px]">
        {columns.map((col) => (
          <div key={col.id}>
            <Skeleton className="h-8 w-full mb-3" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {columns.map((coluna) => {
          const colLeads = leadsGrouped[coluna.id] || [];

          return (
            <div key={coluna.id} className={`border rounded-lg ${coluna.color} border-t-4 bg-muted/30`}>
              <div className="p-3 border-b">
                <h3 className="font-semibold text-sm">{coluna.titulo}</h3>
                <span className="text-xs text-muted-foreground">{colLeads.length} leads</span>
              </div>

              <DroppableColumn id={coluna.id}>
                {colLeads.map((lead) => (
                  <SortableLeadCard
                    key={lead.id}
                    lead={lead}
                    onViewDetails={onViewDetails}
                    onAssumed={onAssumed}
                    onDelete={setLeadToDelete}
                  />
                ))}
                {colLeads.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum lead</p>
                )}
              </DroppableColumn>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} onClick={() => {}} /> : null}
      </DragOverlay>

      <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead <strong>{leadToDelete?.nome_completo}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (leadToDelete) {
                  deleteLead.mutate(leadToDelete.id);
                  setLeadToDelete(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  );
}
