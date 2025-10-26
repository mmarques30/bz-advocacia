import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RelatorioClienteCardProps {
  titulo: string;
  descricao: string;
  icon: LucideIcon;
  ativo: boolean;
  onClick: () => void;
}

export function RelatorioClienteCard({
  titulo,
  descricao,
  icon: Icon,
  ativo,
  onClick,
}: RelatorioClienteCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        ativo && "border-primary bg-accent"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-3 rounded-lg",
            ativo ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">{titulo}</h3>
            <p className="text-sm text-muted-foreground">{descricao}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
