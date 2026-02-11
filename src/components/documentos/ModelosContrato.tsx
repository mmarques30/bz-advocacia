import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MODELOS_CONTRATO } from "@/lib/contratoTemplates";
import { TIPOS_CONTRATO } from "@/types/contratos";
import { FileText, Eye, Sparkles, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadModeloDialog } from "./UploadModeloDialog";
import { EditModeloDialog } from "./EditModeloDialog";
import { useModelosPersonalizados, useDeleteModelo, ModeloConteudo, ModeloPersonalizado } from "@/hooks/useModelosDocumentos";

export function ModelosContrato() {
  const [previewModelo, setPreviewModelo] = useState<typeof MODELOS_CONTRATO[0] | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editModelo, setEditModelo] = useState<ModeloPersonalizado | null>(null);
  const [deleteModelo, setDeleteModelo] = useState<ModeloPersonalizado | null>(null);
  
  const { data: modelosPersonalizados = [] } = useModelosPersonalizados('contrato');
  const deleteModeloMutation = useDeleteModelo();

  const getTipoLabel = (tipo: string) => {
    return TIPOS_CONTRATO.find(t => t.value === tipo)?.label || tipo;
  };

  const modelosPersonalizadosFormatados = modelosPersonalizados.map(m => {
    let conteudo: ModeloConteudo = { servico_padrao: '', tipo_modelo: 'contrato', fonte: 'upload_ia' };
    try {
      conteudo = JSON.parse(m.conteudo);
    } catch {}
    
    return {
      ...m,
      descricaoFormatada: m.descricao || conteudo.servico_padrao,
      template: conteudo.servico_padrao,
    };
  });

  const handleDelete = () => {
    if (!deleteModelo) return;
    deleteModeloMutation.mutate(deleteModelo.id, {
      onSuccess: () => setDeleteModelo(null),
    });
  };

  return (
    <>
      {/* Header com botão de criar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Modelos Disponíveis</h3>
          <p className="text-sm text-muted-foreground">
            {MODELOS_CONTRATO.length + modelosPersonalizadosFormatados.length} modelo(s) disponível(is)
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Sparkles className="h-4 w-4 mr-2" />
          Criar Modelo com IA
        </Button>
      </div>

      {/* Modelos Personalizados (se houver) */}
      {modelosPersonalizadosFormatados.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Modelos Personalizados
          </h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modelosPersonalizadosFormatados.map((modelo) => (
              <Card key={modelo.id} className="hover:border-primary/50 transition-colors border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{modelo.nome}</CardTitle>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary">
                            {getTipoLabel(modelo.categoria || '')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">IA</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {modelo.descricaoFormatada}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditModelo(modelo)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteModelo(modelo)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modelos Padrão */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          Modelos Padrão
        </h4>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MODELOS_CONTRATO.map((modelo) => (
            <Card key={modelo.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{modelo.nome}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {getTipoLabel(modelo.tipo)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {modelo.descricao}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setPreviewModelo(modelo)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar Modelo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dialog de preview */}
      <Dialog open={!!previewModelo} onOpenChange={() => setPreviewModelo(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewModelo?.nome}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            <div className="p-6 bg-muted/30 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {previewModelo?.template}
              </pre>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog de upload com IA */}
      <UploadModeloDialog 
        open={uploadDialogOpen} 
        onOpenChange={setUploadDialogOpen} 
      />

      {/* Dialog de edição */}
      <EditModeloDialog
        open={!!editModelo}
        onOpenChange={(open) => { if (!open) setEditModelo(null); }}
        modelo={editModelo}
      />

      {/* Alert de exclusão */}
      <AlertDialog open={!!deleteModelo} onOpenChange={(open) => { if (!open) setDeleteModelo(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              O modelo "{deleteModelo?.nome}" será desativado. Essa ação pode ser revertida pelo administrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
