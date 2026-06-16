import { useMemo, useState, useEffect } from "react";
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
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lead } from "@/types/leads";
import { LeadCard } from "./LeadCard";
import { useDeleteLead, useUpdateLeadStage } from "@/hooks/useLeads";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LeadsKanbanProps {
  leads: Lead[] | undefined;
  isLoading: boolean;
  onViewDetails: (lead: Lead) => void;
  onAssumed?: (lead: Lead) => void;
}

type ColunaId = "novo" | "enviado" | "qualificado" | "proposta" | "convertido" | "perdido";

const columns: { id: ColunaId; titulo: string; color: string }[] = [
  { id: "novo", titulo: "Novo", color: "border-t-blue-500" },
  { id: "enviado", titulo: "Enviado", color: "border-t-green-500" },
  { id: "qualificado", titulo: "Qualificado", color: "border-t-purple-500" },
  // Alimentada pelo `leadStatusAutomation` (lib): ao gerar proposta ou
  // contrato pra um lead em fase anterior, ele entra aqui automaticamente.
  { id: "proposta", titulo: "Em Proposta", color: "border-t-amber-500" },
  { id: "convertido", titulo: "Convertido", color: "border-t-emerald-500" },
  { id: "perdido", titulo: "Perdido", color: "border-t-red-500" },
];

// Mapeamento drop -> estado salvo no DB.
// Pra cada coluna alvo, define `estagio` (contact_submissions) e
// `status_sdr` (leads_geral, se o lead estiver vinculado).
// O `status_sdr` so e atualizado quando ele eh essencial pra fazer o lead
// aparecer na coluna alvo (porque resolveColuna prioriza status_sdr quando
// o estagio nao e pos-bot — fechado/proposta_enviada/perdido).
const DROP_TARGET: Record<ColunaId, { estagio: string; status_sdr: string | null }> = {
  novo: { estagio: "novo", status_sdr: "novo" },
  // enviado: nao da pra forcar via status_sdr sem etapa_qualificacao
  // (ver resolveColuna). So atualiza estagio; pra leads nao vinculados ao
  // bot vai cair em "enviado" pelo fallback.
  enviado: { estagio: "contato_inicial", status_sdr: null },
  qualificado: { estagio: "em_analise", status_sdr: "qualificacao_iniciada" },
  // proposta / convertido / perdido: estagio pos-bot vence sozinho.
  // Atualiza status_sdr pra coerencia onde fizer sentido.
  proposta: { estagio: "proposta_enviada", status_sdr: null },
  convertido: { estagio: "fechado", status_sdr: "cliente" },
  perdido: { estagio: "perdido", status_sdr: "perdido" },
};

// Deriva coluna do kanban a partir do estado do lead.
// Estados pos-bot (proposta_enviada / fechado / perdido) tem prioridade
// sobre o status_sdr — porque indicam progresso explicitamente registrado
// (proposta gerada, contrato emitido, perda marcada) e ja sairam do fluxo
// automatico do bot. Caso contrario, status_sdr e a fonte da verdade.
function resolveColuna(lead: Lead): ColunaId {
  // 1) Estados pos-bot tem prioridade
  if (lead.estagio === "fechado") return "convertido";
  if (lead.estagio === "proposta_enviada") return "proposta";
  if (lead.estagio === "perdido") return "perdido";

  // 2) status_sdr (fonte da verdade enquanto o lead esta no fluxo do bot)
  const s = lead.status_sdr;
  if (s) {
    switch (s) {
      case "novo":
        return "novo";
      case "em_atendimento_bot":
        // "Enviado" = campanha aguardando resposta. Resto = bot conversando → "Qualificado".
        if (lead.etapa_qualificacao === "aguardando_resposta_campanha") return "enviado";
        return "qualificado";
      case "qualificacao_iniciada":
      case "aguardando_triagem":
      case "sql_aguardando_humano":
      case "assumido_humano":
      case "agendado":
        return "qualificado";
      case "cliente":
        return "convertido";
      case "perdido":
      case "perdido_recuperacao":
      case "mql_frio":
        return "perdido";
    }
  }

  // 3) Fallback p/ leads sem vinculo com bot e sem estagio pos-bot
  switch (lead.estagio) {
    case "novo":
      return "novo";
    case "contato_inicial":
      return "enviado";
    case "em_analise":
      return "qualificado";
    default:
      return "novo";
  }
}

function SortableLeadCard({
  lead,
  onViewDetails,
  onAssumed,
  onDelete,
  onMarkLost,
  onMarkNaoLead,
}: {
  lead: Lead;
  onViewDetails: (lead: Lead) => void;
  onAssumed?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
  onMarkLost?: (lead: Lead) => void;
  onMarkNaoLead?: (lead: Lead) => void;
}) {
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
      <LeadCard
        lead={lead}
        onClick={() => onViewDetails(lead)}
        onAssumed={onAssumed}
        onDelete={onDelete}
        onMarkLost={onMarkLost}
        onMarkNaoLead={onMarkNaoLead}
      />
    </div>
  );
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`p-2 space-y-2 max-h-[60vh] overflow-y-auto rounded-lg transition-colors ${
        isOver ? "bg-accent/50 ring-2 ring-primary/30" : ""
      }`}
    >
      {children}
    </div>
  );
}

export function LeadsKanban({ leads, isLoading, onViewDetails, onAssumed }: LeadsKanbanProps) {
  const queryClient = useQueryClient();
  const deleteLead = useDeleteLead();
  const updateStage = useUpdateLeadStage();
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [leadToLose, setLeadToLose] = useState<Lead | null>(null);
  const [leadNaoLead, setLeadNaoLead] = useState<Lead | null>(null);
  const [tipoNaoLead, setTipoNaoLead] = useState<string>("institucional");
  const [activeId, setActiveId] = useState<string | null>(null);

  // activationConstraint.distance: so inicia drag depois de mover 8px,
  // permitindo que clicks simples no card propaguem pra abrir o detalhe
  // (e os botoes do card funcionem).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Realtime: assim que o bot mudar status_sdr em leads_geral, refaz a query.
  useEffect(() => {
    const ch = supabase
      .channel("leads-kanban-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads_geral" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_submissions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [queryClient]);

  const leadsGrouped = useMemo(() => {
    const acc: Record<ColunaId, Lead[]> = {
      novo: [],
      enviado: [],
      qualificado: [],
      proposta: [],
      convertido: [],
      perdido: [],
    };
    (leads || []).forEach((lead) => {
      acc[resolveColuna(lead)].push(lead);
    });
    return acc;
  }, [leads]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    // Resolve a coluna alvo: drop direto na coluna ou em outro card.
    let targetCol: ColunaId | null = null;
    if (columns.some((c) => c.id === overId)) {
      targetCol = overId as ColunaId;
    } else {
      const alvo = leads?.find((l) => l.id === overId);
      if (alvo) targetCol = resolveColuna(alvo);
    }
    if (!targetCol) return;

    const lead = leads?.find((l) => l.id === leadId);
    if (!lead) return;

    const currentCol = resolveColuna(lead);
    if (currentCol === targetCol) return;

    // Drop em "perdido" pede confirmacao (acao destrutiva — encerra o bot).
    if (targetCol === "perdido") {
      setLeadToLose(lead);
      return;
    }

    const target = DROP_TARGET[targetCol];

    try {
      // Atualiza estagio no contact_submissions
      await updateStage.mutateAsync({ id: lead.id, estagio: target.estagio });

      // E status_sdr no leads_geral, quando faz sentido e o lead esta vinculado.
      // Sem isso, o resolveColuna pode trazer o card de volta pra coluna
      // antiga (pq status_sdr prioritario sobre estagio em estados pre-bot).
      if (target.status_sdr && lead.lead_geral_id) {
        const { error } = await supabase
          .from("leads_geral")
          .update({ status_sdr: target.status_sdr })
          .eq("id", lead.lead_geral_id);
        if (error) throw error;
      }
    } catch (err: any) {
      toast({
        title: "Erro ao mover lead",
        description: err?.message ?? String(err),
        variant: "destructive",
      });
    }
  };

  const handleConfirmLost = async () => {
    if (!leadToLose) return;
    const lead = leadToLose;
    setLeadToLose(null);
    try {
      // Atualiza status do bot (se vinculado) — fonte da verdade do kanban
      if (lead.lead_geral_id) {
        const { error: e1 } = await supabase
          .from("leads_geral")
          .update({ status_sdr: "perdido" })
          .eq("id", lead.lead_geral_id);
        if (e1) throw e1;
      }
      // Mantém contact_submissions.estagio coerente
      await updateStage.mutateAsync({ id: lead.id, estagio: "perdido" });
      toast({ title: "Lead marcado como perdido" });
    } catch (err: any) {
      toast({
        title: "Erro ao marcar como perdido",
        description: err?.message ?? String(err),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-6 gap-4 min-h-[600px]">
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

  const activeLead = activeId ? leads?.find((l) => l.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                    onMarkNaoLead={(l) => { setLeadNaoLead(l); setTipoNaoLead("institucional"); }}
                    onMarkLost={
                      coluna.id !== "perdido" && coluna.id !== "convertido"
                        ? setLeadToLose
                        : undefined
                    }
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

      <AlertDialog open={!!leadToLose} onOpenChange={(open) => !open && setLeadToLose(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como perdido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar <strong>{leadToLose?.nome_completo}</strong> como
              perdido? O lead será movido para a coluna "Perdido" e o bot encerra o atendimento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmLost}
            >
              Marcar perdido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Marcar como nao-lead (fornecedor/parceiro/institucional/pessoal) */}
      <AlertDialog open={!!leadNaoLead} onOpenChange={(open) => !open && setLeadNaoLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como não-lead</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{leadNaoLead?.nome_completo}</strong> sai do funil de leads.
              Escolha a categoria:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Select value={tipoNaoLead} onValueChange={setTipoNaoLead}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="institucional">Institucional (vara, cartório, repartição)</SelectItem>
                <SelectItem value="fornecedor">Fornecedor</SelectItem>
                <SelectItem value="parceiro">Parceiro</SelectItem>
                <SelectItem value="pessoal">Contato pessoal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!leadNaoLead) return;
                try {
                  // Garante lead_geral pra qualquer registro — inclusive os
                  // antigos do formulario do site que nao tem vinculo com o bot.
                  let leadGeralId = leadNaoLead.lead_geral_id;
                  if (!leadGeralId) {
                    const { data: novoId, error: rpcErr } = await (supabase as any).rpc(
                      "garantir_lead_geral_para_contact",
                      { p_contact_submission_id: leadNaoLead.id },
                    );
                    if (rpcErr) throw rpcErr;
                    leadGeralId = novoId as string;
                  }
                  const { error: updErr } = await (supabase as any)
                    .from("leads_geral")
                    .update({ tipo_contato: tipoNaoLead, bot_pausado: true })
                    .eq("id", leadGeralId);
                  if (updErr) throw updErr;
                  queryClient.invalidateQueries({ queryKey: ["leads"] });
                  queryClient.invalidateQueries({ queryKey: ["leads-kanban"] });
                  toast({ title: `Marcado como ${tipoNaoLead}` });
                } catch (err: any) {
                  toast({ title: "Erro ao marcar", description: err?.message, variant: "destructive" });
                } finally {
                  setLeadNaoLead(null);
                }
              }}
            >
              Marcar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  );
}
