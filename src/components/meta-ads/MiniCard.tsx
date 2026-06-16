import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  sub?: string;
  Icon?: LucideIcon;
  className?: string;
}

/**
 * Card padrão das abas do Marketing — tamanho e cor consistentes.
 * Background suave (bg-muted/40), padding p-3, label xs, value lg.
 */
export function MiniCard({ label, value, sub, Icon, className }: Props) {
  return (
    <div className={cn("rounded-lg border bg-muted/40 p-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
      </div>
      <p className="text-lg font-bold mt-1 leading-tight">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{sub}</p>}
    </div>
  );
}
