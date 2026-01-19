import { Coins } from "lucide-react";
import { useConsultasConfig } from "@/hooks/useConsultasConfig";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CreditosWidgetProps {
  compact?: boolean;
}

export function CreditosWidget({ compact = false }: CreditosWidgetProps) {
  const { config, isLoading } = useConsultasConfig();

  if (isLoading) {
    return compact ? (
      <Skeleton className="h-8 w-24" />
    ) : (
      <Skeleton className="h-16 w-32" />
    );
  }

  const creditos = config?.creditos_disponiveis || 0;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border text-sm">
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-medium">{creditos.toLocaleString('pt-BR')}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Créditos disponíveis para consultas</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Coins className="h-4 w-4" />
      <span>{creditos.toLocaleString('pt-BR')} créditos</span>
    </div>
  );
}
