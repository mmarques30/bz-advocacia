import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllDocumentosDrive, DocumentoDriveWithProcess } from "@/hooks/useAllDocumentosDrive";
import { useDeleteDocumentoDrive, useUpdateDocumentoDrive } from "@/hooks/useDocumentosDrive";
import { AllDocumentosFilters } from "@/components/processos/documentos/AllDocumentosFilters";
import { DriveDocumentoCardWithProcess } from "@/components/processos/documentos/DriveDocumentoCardWithProcess";
import { EditDriveDocumentoDialog } from "@/components/processos/documentos/EditDriveDocumentoDialog";
import { TipoDocumentoDrive } from "@/types/documentos-drive";
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
import { FolderOpen } from "lucide-react";

export default function ProcessosDocumentos() {
  const { data: documentos, isLoading } = useAllDocumentosDrive();
  const deleteMutation = useDeleteDocumentoDrive();
  const updateMutation = useUpdateDocumentoDrive();

  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<TipoDocumentoDrive | "todos">("todos");
  const [processoFilter, setProcessoFilter] = useState("todos");
  const [sortOrder, setSortOrder] = useState<"recentes" | "antigos" | "nome">("recentes");
  const [editingDocumento, setEditingDocumento] = useState<DocumentoDriveWithProcess | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const documentosFiltrados = useMemo(() => {
    if (!documentos) return [];

    let filtered = documentos.filter((doc) => {
      const matchSearch = 
        doc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchTipo = tipoFilter === "todos" || doc.tipo_documento === tipoFilter;
      const matchProcesso = processoFilter === "todos" || doc.processo_id === processoFilter;

      return matchSearch && matchTipo && matchProcesso;
    });

    if (sortOrder === "recentes") {
      filtered.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortOrder === "antigos") {
      filtered.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sortOrder === "nome") {
      filtered.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    return filtered;
  }, [documentos, searchTerm, tipoFilter, processoFilter, sortOrder]);

  const handleEdit = (documento: DocumentoDriveWithProcess) => {
    setEditingDocumento(documento);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      const documento = documentos?.find(d => d.id === deletingId);
      if (documento) {
        deleteMutation.mutate({
          id: deletingId,
          processoId: documento.processo_id,
          nome: documento.nome,
        });
      }
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documentos do Google Drive</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie todos os documentos vinculados aos processos
        </p>
      </div>

      <AllDocumentosFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        tipoFilter={tipoFilter}
        onTipoChange={setTipoFilter}
        processoFilter={processoFilter}
        onProcessoChange={setProcessoFilter}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : documentosFiltrados.length > 0 ? (
        <>
          <div className="text-sm text-muted-foreground">
            Mostrando {documentosFiltrados.length} de {documentos?.length || 0} documentos
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {documentosFiltrados.map((documento) => (
              <DriveDocumentoCardWithProcess
                key={documento.id}
                documento={documento}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhum documento encontrado</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {searchTerm || tipoFilter !== "todos" || processoFilter !== "todos"
                  ? "Tente ajustar os filtros de busca"
                  : "Adicione documentos do Google Drive aos processos"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {editingDocumento && (
        <EditDriveDocumentoDialog
          open={!!editingDocumento}
          onOpenChange={(open) => !open && setEditingDocumento(null)}
          documento={editingDocumento}
        />
      )}

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este documento? Esta ação apenas remove a
              vinculação com o processo. O arquivo permanecerá no Google Drive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
