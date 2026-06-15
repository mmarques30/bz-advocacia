import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lead } from "@/types/leads";
import { useAssumirLead } from "@/hooks/useAssumirLead";
import { cn } from "@/lib/utils";

interface Props {
  lead: Lead;
  size?: "sm" | "default";
  className?: string;
  onAssumed?: (lead: Lead) => void;
}

export function AtenderAgoraButton({ lead, size = "sm", className, onAssumed }: Props) {
  const assumir = useAssumirLead({
    onAssumed: () => onAssumed?.(lead),
  });
  // So mostra o botao se o lead realmente esta no estado de espera
  // (status_sdr=sql_aguardando_humano) E ainda nao avançou pra um estagio
  // pos-bot. Sem isso, leads ja em proposta / fechado / perdido continuavam
  // exibindo "Atender agora" porque o status_sdr nao e atualizado quando
  // o estagio muda via leadStatusAutomation.
  if (lead.status_sdr !== "sql_aguardando_humano") return null;
  if (
    lead.estagio === "fechado" ||
    lead.estagio === "proposta_enviada" ||
    lead.estagio === "perdido"
  ) return null;

  return (
    <Button
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        if (!lead.lead_geral_id) return;
        assumir.mutate(lead.lead_geral_id);
      }}
      disabled={assumir.isPending || !lead.lead_geral_id}
      className={cn(
        "bg-green-600 hover:bg-green-700 text-white gap-1.5",
        className,
      )}
    >
      {assumir.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Check className="h-3.5 w-3.5" />
      )}
      Atender agora
    </Button>
  );
}
