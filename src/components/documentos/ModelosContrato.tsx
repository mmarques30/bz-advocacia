import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MODELOS_CONTRATO } from "@/lib/contratoTemplates";
import { TIPOS_CONTRATO } from "@/types/contratos";
import { FileText, Eye, Sparkles, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadModeloDialog } from "./UploadModeloDialog";
import { useModelosPersonalizados, ModeloConteudo } from "@/hooks/useModelosDocumentos";

export function ModelosContrato() {
  const [previewModelo, setPreviewModelo] = useState<typeof MODELOS_CONTRATO[0] | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  // Buscar modelos personalizados do banco
  const { data: modelosPersonalizados = [] } = useModelosPersonalizados('contrato');

  const getTipoLabel = (tipo: string) => {
    return TIPOS_CONTRATO.find(t => t.value === tipo)?.label || tipo;
  };

  // Combinar modelos estáticos com personalizados
  const modelosPersonalizadosFormatados = modelosPersonalizados.map(m => {
    let conteudo: ModeloConteudo = { servico_padrao: '', tipo_modelo: 'contrato', fonte: 'upload_ia' };
    try {
      conteudo = JSON.parse(m.conteudo);
    } catch {}
    
    return {
      id: m.id,
      nome: m.nome,
      tipo: m.categoria || 'civel',
      descricao: m.descricao || conteudo.servico_padrao,
      template: conteudo.servico_padrao,
      isCustom: true,
    };
  });

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
                            {getTipoLabel(modelo.tipo)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">IA</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {modelo.descricao}
                  </p>
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
    </>
  );
}
