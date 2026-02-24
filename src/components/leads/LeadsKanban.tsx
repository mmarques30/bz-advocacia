import { useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Lead, LeadStatus } from "@/types/leads";
import { LeadCard } from "./LeadCard";
import { useUpdateLeadStage } from "@/hooks/useLeads";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const VALID_STAGES: string[] = ['novo', 'contato_inicial', 'em_analise', 'proposta_enviada', 'fechado', 'perdido'];

interface LeadsKanbanProps {
  leads: Lead[] | undefined;
  isLoading: boolean;
  onViewDetails: (lead: Lead) => void;
}

function SortableLeadCard({ lead, onViewDetails }: { lead: Lead; onViewDetails: (lead: Lead) => void }) {
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
      <LeadCard lead={lead} onClick={() => onViewDetails(lead)} />
    </div>
  );
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] pr-2 rounded-lg transition-colors ${
        isOver ? 'bg-accent/50 ring-2 ring-primary/30' : ''
      }`}
    >
      {children}
    </div>
  );
}

export function LeadsKanban({ leads, isLoading, onViewDetails }: LeadsKanbanProps) {
  const updateStage = useUpdateLeadStage();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  const columns: { estagio: LeadStatus; titulo: string }[] = [
    { estagio: "novo", titulo: "Novo" },
    { estagio: "contato_inicial", titulo: "Contato Inicial" },
    { estagio: "em_analise", titulo: "Em Análise" },
    { estagio: "proposta_enviada", titulo: "Proposta" },
    { estagio: "fechado", titulo: "Fechado/Perdido" },
  ];

  const leadsGrouped = useMemo(() => {
    if (!leads) return {};

    return leads.reduce((acc, lead) => {
      let estagio = lead.estagio;
      if (estagio === "perdido") estagio = "fechado";

      if (!acc[estagio]) acc[estagio] = [];
      acc[estagio].push(lead);
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

    let novoEstagio: string;

    if (VALID_STAGES.includes(overId)) {
      novoEstagio = overId;
    } else {
      const leadAlvo = leads?.find((l) => l.id === overId);
      if (leadAlvo) {
        novoEstagio = leadAlvo.estagio;
        if (novoEstagio === 'perdido') novoEstagio = 'fechado';
      } else {
        return;
      }
    }

    const lead = leads?.find((l) => l.id === leadId);
    if (!lead) return;

    let estagioAtual = lead.estagio;
    if (estagioAtual === 'perdido') estagioAtual = 'fechado';

    if (estagioAtual === novoEstagio) return;

    updateStage.mutate({ id: leadId, estagio: novoEstagio });
  };

  const activeLead = activeId ? leads?.find((l) => l.id === activeId) : null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-4 min-h-[600px]">
        {columns.map((col) => (
          <div key={col.estagio}>
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-h-[600px]">
        {columns.map((coluna) => {
          const colLeads = leadsGrouped[coluna.estagio] || [];

          return (
            <div key={coluna.estagio} className="flex flex-col">
              <div className="font-medium mb-3 flex items-center justify-between sticky top-0 bg-background pb-2">
                <span className="text-sm">{coluna.titulo}</span>
                <Badge variant="secondary" className="h-6">
                  {colLeads.length}
                </Badge>
              </div>

              <DroppableColumn id={coluna.estagio}>
                {colLeads.map((lead) => (
                  <SortableLeadCard
                    key={lead.id}
                    lead={lead}
                    onViewDetails={onViewDetails}
                  />
                ))}
                {colLeads.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                    Nenhum lead
                  </div>
                )}
              </DroppableColumn>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} onClick={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
