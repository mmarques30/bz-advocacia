import { useState } from "react";
import { useLeadNotas, useCreateNota, useUpdateNota, useDeleteNota } from "@/hooks/useLeadNotas";
import { useCreateActivity } from "@/hooks/useActivities";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, MoreVertical, Edit, Trash, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadNotasProps {
  leadId: string;
  currentUserId: string;
}

export function LeadNotas({ leadId, currentUserId }: LeadNotasProps) {
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState<{ id: string; texto: string } | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const { data: notas, isLoading } = useLeadNotas(leadId);
  const createNota = useCreateNota();
  const updateNota = useUpdateNota();
  const deleteNota = useDeleteNota();
  const createActivity = useCreateActivity();

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    await createNota.mutateAsync({
      lead_id: leadId,
      texto: newNote,
      usuario_id: currentUserId,
    });

    await createActivity.mutateAsync({
      tipo: "nota_adicionada",
      descricao: "Nova nota adicionada ao lead",
      entidade_tipo: "lead",
      entidade_id: leadId,
      usuario_id: currentUserId,
    });

    setNewNote("");
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !editingNote.texto.trim()) return;

    await updateNota.mutateAsync({
      id: editingNote.id,
      texto: editingNote.texto,
    });

    setEditingNote(null);
  };

  const handleDeleteNote = async () => {
    if (!deletingNoteId) return;

    await deleteNota.mutateAsync(deletingNoteId);
    setDeletingNoteId(null);
  };

  const getInitials = (userId: string) => {
    return userId.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Campo de nova nota */}
      <div className="space-y-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Adicionar nova nota..."
          rows={3}
          className="resize-none"
        />
        <Button 
          onClick={handleAddNote} 
          disabled={!newNote.trim() || createNota.isPending}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Nota
        </Button>
      </div>

      <Separator />

      {/* Lista de notas */}
      {!notas || notas.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhuma nota adicionada ainda</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {notas.map((nota) => (
              <div key={nota.id} className="p-4 border rounded-lg hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(nota.usuario_id)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(nota.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        {nota.updated_at && " (editado)"}
                      </p>
                    </div>
                  </div>

                  {nota.usuario_id === currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Abrir ações da nota">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingNote({ id: nota.id, texto: nota.texto })}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeletingNoteId(nota.id)}
                          className="text-destructive"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <p className="text-sm whitespace-pre-wrap">{nota.texto}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Dialog de edição */}
      <AlertDialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Editar Nota</AlertDialogTitle>
            <AlertDialogDescription>
              Faça as alterações necessárias na nota.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={editingNote?.texto || ""}
            onChange={(e) => setEditingNote(editingNote ? { ...editingNote, texto: e.target.value } : null)}
            rows={5}
            className="resize-none"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateNote}>
              Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deletingNoteId} onOpenChange={(open) => !open && setDeletingNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Nota</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
