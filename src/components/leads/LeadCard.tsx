import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/types/leads";
import { cn } from "@/lib/utils";

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const diasParado = lead.dias_parado || 0;

  const getOrigemBadgeColor = (origem: string) => {
    const colors: Record<string, string> = {
      google: "bg-blue-100 text-blue-800 border-blue-200",
      meta: "bg-purple-100 text-purple-800 border-purple-200",
      indicacao: "bg-green-100 text-green-800 border-green-200",
      site: "bg-primary/10 text-primary border-primary/20",
      outro: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[origem] || colors.outro;
  };

  return (
    <Card
      className="p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm line-clamp-1">{lead.nome_completo}</p>
          {diasParado > 7 && (
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn("text-xs", getOrigemBadgeColor(lead.origem))}>
            {lead.origem.charAt(0).toUpperCase() + lead.origem.slice(1)}
          </Badge>
          <span className="text-xs text-muted-foreground truncate">
            {lead.tipo_processo === 'Outro' && lead.outro_tipo_processo
              ? lead.outro_tipo_processo
              : lead.tipo_processo}
          </span>
        </div>

        {diasParado > 0 && (
          <p
            className={cn(
              "text-xs",
              diasParado > 7 ? "text-destructive font-medium" : "text-muted-foreground"
            )}
          >
            Parado há {diasParado} {diasParado === 1 ? 'dia' : 'dias'}
          </p>
        )}
      </div>
    </Card>
  );
}
