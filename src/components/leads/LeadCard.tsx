import { Clock, Briefcase, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Lead } from "@/types/leads";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useWhatsAppTemplates } from "@/hooks/useWhatsAppTemplates";
import { processarTemplate } from "@/types/whatsapp";
import { openWhatsAppLink } from "@/lib/whatsappUtils";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { LeadBotBadge } from "./LeadBotBadge";
import { AtenderAgoraButton } from "./AtenderAgoraButton";

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

function calcDiasDesdeContato(createdAt: string): number {
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const dias = calcDiasDesdeContato(lead.created_at);
  const tipoServico = lead.tipo_processo === 'Outro' && lead.outro_tipo_processo
    ? lead.outro_tipo_processo
    : lead.tipo_processo;

  const { data: templatesPrimeiroContato } = useWhatsAppTemplates({
    tipo: 'primeiro_contato',
    ativo: true,
  });

  const handlePrimeiroContato = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const template = templatesPrimeiroContato?.[0];
    if (!template) {
      toast({
        title: "Modelo não encontrado",
        description: "Crie um modelo do tipo 'Primeiro Contato' em Administrativo > Modelos",
        variant: "destructive",
      });
      return;
    }
    if (!lead.telefone) {
      toast({ title: "Telefone não cadastrado", variant: "destructive" });
      return;
    }
    const mensagem = processarTemplate(template.mensagem, {
      nome_cliente: lead.nome_completo,
      tipo_processo: tipoServico || '',
    });
    openWhatsAppLink(lead.telefone, mensagem);
    await supabase.from("lead_interacoes").insert({
      lead_id: lead.id,
      tipo: "whatsapp",
      canal: "whatsapp",
      direcao: "saida",
      mensagem,
    });
    toast({ title: "Mensagem de primeiro contato enviada" });
  };

  const isHot = lead.status_sdr === "sql_aguardando_humano";
  return (
    <Card
      className={cn(
        "p-3 cursor-pointer hover:shadow-md transition-shadow",
        isHot && "ring-2 ring-orange-500 border-orange-300",
      )}
      onClick={onClick}
    >
      <div className="space-y-1.5">
        <div className="flex items-start justify-between">
          <p className="font-medium text-sm line-clamp-1">{lead.nome_completo}</p>
          {lead.estagio === 'novo' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-green-600 hover:text-green-700"
              onClick={handlePrimeiroContato}
              title="Primeiro Contato via WhatsApp"
              aria-label={`Primeiro contato via WhatsApp com ${lead.nome_completo}`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <LeadBotBadge lead={lead} />
          {isHot && <AtenderAgoraButton lead={lead} />}
        </div>

        {tipoServico && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Briefcase className="h-3 w-3 flex-shrink-0" />
            <span className="text-xs truncate">{tipoServico}</span>
          </div>
        )}

        <div className={cn(
          "flex items-center gap-1.5 text-xs",
          dias > 7 ? "text-destructive" : "text-muted-foreground"
        )}>
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span>há {dias} {dias === 1 ? 'dia' : 'dias'}</span>
        </div>
      </div>
    </Card>
  );
}
