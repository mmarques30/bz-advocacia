import { Bot, Zap, User, Calendar, CheckCircle2, Droplet, XCircle, ClipboardList } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Lead } from "@/types/leads";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type BadgeInfo = {
  label: string;
  className: string;
  Icon: typeof Bot;
  animated?: boolean;
};

export function getBotBadgeInfo(lead: Lead): BadgeInfo {
  // Sem vínculo com bot → atendimento manual
  if (!lead.lead_geral_id) {
    return {
      label: "Atendimento manual",
      className: "bg-gray-100 text-gray-600 border-gray-200",
      Icon: ClipboardList,
    };
  }
  switch (lead.status_sdr) {
    case "sql_aguardando_humano":
      return {
        label: "Lead quente — Atender!",
        className: "bg-orange-500 text-white border-orange-600 shadow-md",
        Icon: Zap,
        animated: true,
      };
    case "em_atendimento_bot":
    case "novo":
      return {
        label: "Bot conversando",
        className: "bg-blue-100 text-blue-800 border-blue-200",
        Icon: Bot,
      };
    case "qualificacao_iniciada":
      return {
        label: "Qualificação iniciada",
        className: "bg-indigo-100 text-indigo-800 border-indigo-200",
        Icon: Bot,
      };
    case "assumido_humano":
      return {
        label: "Atendimento humano",
        className: "bg-green-100 text-green-800 border-green-200",
        Icon: User,
      };
    case "agendado":
      return {
        label: "Reunião marcada",
        className: "bg-cyan-100 text-cyan-800 border-cyan-200",
        Icon: Calendar,
      };
    case "cliente":
      return {
        label: "Cliente fechado",
        className: "bg-emerald-200 text-emerald-900 border-emerald-300",
        Icon: CheckCircle2,
      };
    case "mql_frio":
      return {
        label: "Lead frio",
        className: "bg-slate-100 text-slate-600 border-slate-200",
        Icon: Droplet,
      };
    case "perdido":
      return {
        label: "Perdido",
        className: "bg-gray-200 text-gray-700 border-gray-300",
        Icon: XCircle,
      };
    case "perdido_recuperacao":
      return {
        label: "Perdido (sem resposta 3d)",
        className: "bg-rose-100 text-rose-800 border-rose-200",
        Icon: XCircle,
      };
    default:
      return {
        label: "Bot",
        className: "bg-blue-100 text-blue-800 border-blue-200",
        Icon: Bot,
      };
  }
}

interface LeadBotBadgeProps {
  lead: Lead;
  size?: "sm" | "md";
}

export function LeadBotBadge({ lead, size = "sm" }: LeadBotBadgeProps) {
  const info = getBotBadgeInfo(lead);
  const Icon = info.Icon;
  const sizeCls = size === "sm" ? "text-[10px] px-1.5 py-0.5 gap-1" : "text-xs px-2 py-1 gap-1.5";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center rounded-full border font-semibold whitespace-nowrap",
            sizeCls,
            info.className,
            info.animated && "animate-pulse",
          )}
        >
          <Icon className="h-3 w-3 shrink-0" />
          <span>{info.label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs space-y-1">
        <p className="font-semibold">
          {info.label}
        </p>
        {lead.fluxo_sdr && (
          <p className="text-xs"><span className="text-muted-foreground">Fluxo:</span> {lead.fluxo_sdr}</p>
        )}
        {lead.area_normalizada && (
          <p className="text-xs"><span className="text-muted-foreground">Área:</span> {lead.area_normalizada}</p>
        )}
        {lead.etapa_qualificacao && (
          <p className="text-xs"><span className="text-muted-foreground">Etapa:</span> {lead.etapa_qualificacao}</p>
        )}
        {typeof lead.score === "number" && lead.score > 0 && (
          <p className="text-xs"><span className="text-muted-foreground">Score:</span> {lead.score}</p>
        )}
        {lead.ultima_mensagem_em && (
          <p className="text-xs">
            <span className="text-muted-foreground">Última msg:</span>{" "}
            {format(new Date(lead.ultima_mensagem_em), "dd/MM HH:mm")}
          </p>
        )}
        {!lead.lead_geral_id && (
          <p className="text-xs text-muted-foreground">Lead cadastrado manualmente, sem passagem pelo bot.</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
