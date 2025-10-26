import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { Tag } from "@/hooks/useTags";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TagCardProps {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (id: string) => void;
}

const tipoLabels = {
  lead: "Lead",
  processo: "Processo",
  geral: "Geral",
};

export function TagCard({ tag, onEdit, onDelete }: TagCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge style={{ backgroundColor: tag.cor }} className="text-white">
                {tag.nome}
              </Badge>
              <Badge variant="outline">{tipoLabels[tag.tipo]}</Badge>
            </div>
            
            {tag.descricao && (
              <p className="text-sm text-muted-foreground mb-2">{tag.descricao}</p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{tag.uso_count || 0} uso(s)</span>
              <span>Criado em {format(new Date(tag.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(tag)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(tag.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
