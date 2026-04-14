import { useState } from "react";
import { useUpdateLead } from "@/hooks/useLeads";
import { useCreateActivity } from "@/hooks/useActivities";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/leads";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { Upload, FileText, Download, Trash, File } from "lucide-react";
import { toast } from "@/lib/toast";

interface LeadDocumentosProps {
  lead: Lead;
  currentUserId: string;
}

export function LeadDocumentos({ lead, currentUserId }: LeadDocumentosProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);

  const updateLead = useUpdateLead();
  const createActivity = useCreateActivity();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newPaths: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${lead.id}/${Date.now()}_${file.name}`;

        const { error } = await supabase.storage
          .from("contact-documents")
          .upload(path, file);

        if (error) throw error;

        newPaths.push(path);
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      const updatedDocs = [...(lead.documentos || []), ...newPaths];
      await updateLead.mutateAsync({
        id: lead.id,
        documentos: updatedDocs,
      });

      await createActivity.mutateAsync({
        tipo: "documento_anexado",
        descricao: `${newPaths.length} documento(s) anexado(s)`,
        entidade_tipo: "lead",
        entidade_id: lead.id,
        usuario_id: currentUserId,
      });

      toast({
        title: "Documentos enviados",
        description: `${newPaths.length} documento(s) anexado(s) com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar documentos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      event.target.value = "";
    }
  };

  const handleDownload = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("contact-documents")
        .download(path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = path.split("/").pop() || "documento";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download iniciado",
        description: "O documento está sendo baixado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao baixar documento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingDoc) return;

    try {
      const { error } = await supabase.storage
        .from("contact-documents")
        .remove([deletingDoc]);

      if (error) throw error;

      const updatedDocs = (lead.documentos || []).filter((d) => d !== deletingDoc);
      await updateLead.mutateAsync({
        id: lead.id,
        documentos: updatedDocs,
      });

      toast({
        title: "Documento excluído",
        description: "O documento foi removido com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir documento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingDoc(null);
    }
  };

  const getFileName = (path: string) => {
    const parts = path.split("/");
    const fileName = parts[parts.length - 1];
    return fileName.replace(/^\d+_/, "");
  };

  const isImage = (path: string) => {
    const ext = path.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
  };

  return (
    <div className="space-y-4">
      {/* Área de upload */}
      <div>
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
            <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Clique para selecionar arquivos
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, JPG, PNG (máx. 10MB por arquivo)
            </p>
          </div>
        </label>
        <input
          id="file-upload"
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
        />

        {isUploading && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-1 text-center">
              Enviando... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}
      </div>

      {/* Lista de documentos */}
      {!lead.documentos || lead.documentos.length === 0 ? (
        <div className="text-center py-12">
          <File className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum documento anexado ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {lead.documentos.map((doc) => (
            <div key={doc} className="border rounded-lg overflow-hidden">
              <div className="h-40 bg-muted flex items-center justify-center p-4">
                {isImage(doc) ? (
                  <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/contact-documents/${doc}`}
                    alt={getFileName(doc)}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <FileText className="h-16 w-16 text-muted-foreground" />
                )}
              </div>

              <div className="p-3 space-y-2">
                <p className="text-sm font-medium truncate" title={getFileName(doc)}>
                  {getFileName(doc)}
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(doc)}
                    className="flex-1"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Baixar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingDoc(doc)}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deletingDoc} onOpenChange={(open) => !open && setDeletingDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
