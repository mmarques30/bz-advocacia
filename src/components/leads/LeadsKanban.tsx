import { useMemo, useState, useEffect } from "react";
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

interface LeadsKanbanProps {
  leads: Lead[] | undefined;
  isLoading: boolean;
  onViewDetails: (lead: Lead) => void;
  onAssumed?: (lead: Lead) => void;
}

type ColunaId = "novo" | "enviado" | "qualificado" | "convertido" | "perdido";

const columns: { id: ColunaId; titulo: string; color: string }[] = [
  { id: "novo", titulo: "Novo", color: "border-t-blue-500" },
  { id: "enviado", titulo: "Enviado", color: "border-t-green-500" },
  { id: "qualificado", titulo: "Qualificado", color: "border-t-purple-500" },
  { id: "convertido", titulo: "Convertido", color: "border-t-emerald-500" },
  { id: "perdido", titulo: "Perdido", color: "border-t-red-500" },
];

// Deriva coluna do kanban a partir do status_sdr (fonte da verdade do bot).
// Fallback: lead.estagio (legacy / leads sem passagem pelo bot).
function resolveColuna(lead: Lead): ColunaId {
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

  // Fallback p/ leads sem vínculo com bot
  switch (lead.estagio) {
    case "novo":
      return "novo";
    case "contato_inicial":
      return "enviado";
    case "em_analise":
    case "proposta_enviada":
      return "qualificado";
    case "fechado":
      return "convertido";
    case "perdido":
      return "perdido";
    default:
      return "novo";
  }
}

export function LeadsKanban({ leads, isLoading, onViewDetails, onAssumed }: LeadsKanbanProps) {
  const queryClient = useQueryClient();
  const deleteLead = useDeleteLead();
  const updateStage = useUpdateLeadStage();
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [leadToLose, setLeadToLose] = useState<Lead | null>(null);

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
      convertido: [],
      perdido: [],
    };
    (leads || []).forEach((lead) => {
      acc[resolveColuna(lead)].push(lead);
    });
    return acc;
  }, [leads]);

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
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {columns.map((coluna) => {
          const colLeads = leadsGrouped[coluna.id] || [];
          return (
            <div key={coluna.id} className={`border rounded-lg ${coluna.color} border-t-4 bg-muted/30`}>
              <div className="p-3 border-b">
                <h3 className="font-semibold text-sm">{coluna.titulo}</h3>
                <span className="text-xs text-muted-foreground">{colLeads.length} leads</span>
              </div>
              <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                {colLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onClick={() => onViewDetails(lead)}
                    onAssumed={onAssumed}
                    onDelete={setLeadToDelete}
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
              </div>
            </div>
          );
        })}
      </div>

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
    </>
  );
}
