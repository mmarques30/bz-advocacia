import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import TagBadge from "./TagBadge";
import type { TagWithStats } from "@/types/tags";
import { TIPO_LABELS } from "@/types/tags";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TagCardProps {
  tag: TagWithStats;
  onEdit: (tag: TagWithStats) => void;
  onDelete: (id: string) => void;
}

export default function TagCard({ tag, onEdit, onDelete }: TagCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1 space-y-2">
          <TagBadge nome={tag.nome} cor={tag.cor} size="lg" />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {TIPO_LABELS[tag.tipo]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Usado {tag.uso_count}x
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(tag)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deletar tag?</AlertDialogTitle>
                <AlertDialogDescription>
                  {tag.uso_count > 0 ? (
                    <>
                      Esta tag está sendo usada em <strong>{tag.uso_count}</strong> {tag.uso_count === 1 ? 'item' : 'itens'}.
                      Ao deletá-la, ela será removida de todos esses itens. Esta ação não pode ser desfeita.
                    </>
                  ) : (
                    'Esta ação não pode ser desfeita. A tag será permanentemente deletada.'
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(tag.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Deletar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      {tag.descricao && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{tag.descricao}</p>
        </CardContent>
      )}
    </Card>
  );
}
