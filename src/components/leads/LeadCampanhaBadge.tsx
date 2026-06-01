import { Megaphone } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Lead } from "@/types/leads";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  enviada: "Enviada — aguardando resposta",
  respondida: "Respondida",
  erro: "Erro no envio",
};

interface Props {
  lead: Lead;
  size?: "sm" | "md";
}

export function LeadCampanhaBadge({ lead, size = "sm" }: Props) {
  if (lead.origem_sdr !== "campanha_recuperacao_form") return null;

  const camp = lead.campanha_envio;
  const sizeCls = size === "sm" ? "text-[10px] px-1.5 py-0.5 gap-1" : "text-xs px-2 py-1 gap-1.5";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center rounded-full border font-semibold whitespace-nowrap bg-purple-100 text-purple-800 border-purple-300 ${sizeCls}`}
        >
          <Megaphone className="h-3 w-3 shrink-0" />
          <span>Recuperação</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs space-y-1">
        <p className="font-semibold">Campanha de recuperação</p>
        {camp?.enviada_em && (
          <p className="text-xs">
            <span className="text-muted-foreground">Enviada em:</span>{" "}
            {format(new Date(camp.enviada_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </p>
        )}
        {camp?.variacao_texto && (
          <p className="text-xs">
            <span className="text-muted-foreground">Variação do texto:</span> v{camp.variacao_texto}
          </p>
        )}
        {camp?.status && (
          <p className="text-xs">
            <span className="text-muted-foreground">Status:</span>{" "}
            {STATUS_LABEL[camp.status] ?? camp.status}
          </p>
        )}
        {camp?.respondida_em && (
          <p className="text-xs">
            <span className="text-muted-foreground">Respondeu em:</span>{" "}
            {format(new Date(camp.respondida_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
