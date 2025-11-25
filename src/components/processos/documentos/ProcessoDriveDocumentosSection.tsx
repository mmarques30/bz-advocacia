import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Link2 } from "lucide-react";
import { useDocumentosDrive, useDeleteDocumentoDrive } from "@/hooks/useDocumentosDrive";
import { DocumentoDrive } from "@/types/documentos-drive";
import { DriveDocumentoCard } from "./DriveDocumentoCard";
import { AddDriveDocumentoDialog } from "./AddDriveDocumentoDialog";
import { EditDriveDocumentoDialog } from "./EditDriveDocumentoDialog";
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

interface ProcessoDriveDocumentosSectionProps {
  processoId: string;
}

export function ProcessoDriveDocumentosSection({ processoId }: ProcessoDriveDocumentosSectionProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDocumento, setSelectedDocumento] = useState<DocumentoDrive | null>(null);
  const [documentoToDelete, setDocumentoToDelete] = useState<string | null>(null);

  const { data: documentos, isLoading } = useDocumentosDrive(processoId);
  const deleteMutation = useDeleteDocumentoDrive();

  const handleEdit = (documento: DocumentoDrive) => {
    setSelectedDocumento(documento);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    setDocumentoToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (documentoToDelete) {
      deleteMutation.mutate(documentoToDelete, {
        onSuccess: () => {
          setShowDeleteDialog(false);
          setDocumentoToDelete(null);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Documentos do Google Drive</h3>
          {documentos && documentos.length > 0 && (
            <span className="text-sm text-muted-foreground">({documentos.length})</span>
          )}
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {!documentos || documentos.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">Nenhum documento vinculado ainda.</p>
          <p className="text-sm text-muted-foreground mb-4">
            Clique em "Adicionar" para vincular documentos do Google Drive.
          </p>
          <Button onClick={() => setShowAddDialog(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Primeiro Documento
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {documentos.map((documento) => (
            <DriveDocumentoCard
              key={documento.id}
              documento={documento}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <AddDriveDocumentoDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        processoId={processoId}
      />

      <EditDriveDocumentoDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        documento={selectedDocumento}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover documento do processo?</AlertDialogTitle>
            <AlertDialogDescription>
              O documento permanecerá no Google Drive, mas não estará mais vinculado a este
              processo. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sim, Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
