import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TipoRelatorioVendas } from "@/types/relatorios-vendas";

interface RelatorioVendasCardProps {
  tipo: TipoRelatorioVendas;
  titulo: string;
  descricao: string;
  icon: LucideIcon;
  isSelected: boolean;
  onClick: () => void;
}

export function RelatorioVendasCard({
  titulo,
  descricao,
  icon: Icon,
  isSelected,
  onClick,
}: RelatorioVendasCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:scale-105",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{titulo}</CardTitle>
            <CardDescription className="text-sm">{descricao}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
