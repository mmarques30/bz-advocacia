import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { ConversaBot } from "@/components/leads/ConversaBot";
import { Badge } from "@/components/ui/badge";
import { Phone, User } from "lucide-react";

interface Props {
  leadId: string;
}

const STATUS_COLORS: Record<string, string> = {
  novo: "bg-blue-100 text-blue-800",
  em_atendimento_bot: "bg-amber-100 text-amber-800",
  assumido_humano: "bg-green-100 text-green-800",
  agendado: "bg-purple-100 text-purple-800",
  cliente: "bg-emerald-100 text-emerald-800",
  perdido: "bg-gray-100 text-gray-700",
};

export function ChatPanel({ leadId }: Props) {
  const qc = useQueryClient();
  const { data: lead } = useQuery({
    queryKey: ["atendimento-lead", leadId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("leads_geral")
        .select("id, full_name, phone_number, status_sdr, bot_pausado, tipo_servico, area_normalizada, origem_sdr, score, etapa_qualificacao")
        .eq("id", leadId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Realtime: invalida ao mudar status_sdr / bot_pausado
  useEffect(() => {
    if (!leadId) return;
    const ch = supabase
      .channel(`chatpanel-lead-${leadId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads_geral", filter: `id=eq.${leadId}` }, () => {
        qc.invalidateQueries({ queryKey: ["atendimento-lead", leadId] });
        qc.invalidateQueries({ queryKey: ["atendimento-conversas"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [leadId, qc]);



  // Marca como lido ao abrir / quando mudar de lead
  useEffect(() => {
    if (!leadId) return;
    (supabase as any)
      .from("leads_geral")
      .update({ ultima_leitura_humano: new Date().toISOString() })
      .eq("id", leadId)
      .then(() => {});
  }, [leadId]);




  if (!lead) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Carregando conversa...
      </div>
    );
  }

  const tipoCaso = lead.tipo_servico || lead.area_normalizada;
  const statusCor = STATUS_COLORS[lead.status_sdr || ""] || "bg-gray-100 text-gray-700";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b bg-card px-4 py-3 flex items-start gap-3 shrink-0">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="text-sm font-semibold truncate">{lead.full_name || "Sem nome"}</h3>
          {lead.phone_number && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Phone className="h-3 w-3" /> {lead.phone_number}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {tipoCaso && (
              <Badge variant="secondary" className="h-5 text-[10px] font-normal">
                {tipoCaso}
              </Badge>
            )}
            {lead.status_sdr && (
              <Badge className={`h-5 text-[10px] font-normal border-0 ${statusCor}`}>
                {lead.status_sdr.replace(/_/g, " ")}
              </Badge>
            )}
            {lead.origem_sdr && (
              <Badge variant="outline" className="h-5 text-[10px] font-normal">
                {lead.origem_sdr}
              </Badge>
            )}
            {lead.etapa_qualificacao && (
              <Badge variant="outline" className="h-5 text-[10px] font-normal">
                {lead.etapa_qualificacao}
              </Badge>
            )}
            {lead.score != null && (
              <Badge variant="outline" className="h-5 text-[10px] font-normal">
                score {lead.score}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden p-3">
        <ConversaBot
          leadGeralId={lead.id}
          status_sdr={lead.status_sdr}
          bot_pausado={lead.bot_pausado}
          fullHeight
          autoFocus
        />
      </div>
    </div>
  );
}
