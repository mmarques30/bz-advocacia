import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Upload, Download, Trash2, FileText, FolderUp } from "lucide-react";
import { useProcessoDocumentos, useUploadDocumento, useDeleteDocumento, useDownloadDocumento } from "@/hooks/useProcessoDocumentos";
import { CATEGORIA_DOCUMENTO_LABELS, CategoriaDocumento } from "@/types/processos";
import { format } from "date-fns";
import { useRef } from "react";
import { ProcessoDriveDocumentosSection } from "../documentos/ProcessoDriveDocumentosSection";

interface ProcessoDocumentosTabProps {
  processoId: string;
}

export function ProcessoDocumentosTab({ processoId }: ProcessoDocumentosTabProps) {
  const { data: documentos, isLoading } = useProcessoDocumentos(processoId);
  const uploadDocumento = useUploadDocumento();
  const deleteDocumento = useDeleteDocumento();
  const downloadDocumento = useDownloadDocumento();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null, categoria: CategoriaDocumento) => {
    if (!files) return;
    
    for (let i = 0; i < files.length; i++) {
      await uploadDocumento.mutateAsync({
        file: files[i],
        processoId,
        categoria,
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando documentos...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Seção de Arquivos Locais */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FolderUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Arquivos Locais</h3>
        </div>

        <Tabs defaultValue="peticao">
          <TabsList>
            {Object.entries(CATEGORIA_DOCUMENTO_LABELS).map(([key, label]) => (
              <TabsTrigger key={key} value={key}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(CATEGORIA_DOCUMENTO_LABELS).map(([categoria, label]) => (
            <TabsContent key={categoria} value={categoria} className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">{label}</h4>
                <Button
                  size="sm"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      handleFileUpload(target.files, categoria as CategoriaDocumento);
                    };
                    input.click();
                  }}
                  disabled={uploadDocumento.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadDocumento.isPending ? "Enviando..." : "Upload"}
                </Button>
              </div>

              {!documentos || documentos.filter(d => d.categoria === categoria).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  Nenhum documento nesta categoria
                </div>
              ) : (
                <div className="space-y-2">
                  {documentos
                    .filter(d => d.categoria === categoria)
                    .map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{doc.nome_arquivo}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatBytes(doc.tamanho_bytes)} • {format(new Date(doc.created_at), "dd/MM/yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadDocumento.mutate(doc)}
                            disabled={downloadDocumento.isPending}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteDocumento.mutate(doc)}
                            disabled={deleteDocumento.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Separator className="my-8" />

      {/* Seção de Documentos do Google Drive */}
      <ProcessoDriveDocumentosSection processoId={processoId} />
    </div>
  );
}
