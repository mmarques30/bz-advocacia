import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ConversaBot } from "@/components/leads/ConversaBot";
import { Phone, User } from "lucide-react";

interface Props {
  leadId: string;
}

export function ChatPanel({ leadId }: Props) {
  const { data: lead } = useQuery({
    queryKey: ["atendimento-lead", leadId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("leads_geral")
        .select("id, full_name, phone_number, status_sdr, bot_pausado")
        .eq("id", leadId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

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

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-card px-4 py-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">{lead.full_name || "Sem nome"}</h3>
          {lead.phone_number && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Phone className="h-3 w-3" /> {lead.phone_number}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 p-3">
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
