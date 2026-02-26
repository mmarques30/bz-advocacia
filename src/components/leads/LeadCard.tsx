import { Clock, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Lead } from "@/types/leads";
import { cn } from "@/lib/utils";

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

  return (
    <Card
      className="p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="space-y-1.5">
        <p className="font-medium text-sm line-clamp-1">{lead.nome_completo}</p>

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
