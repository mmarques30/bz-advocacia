import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MODELOS_CONTRATO } from "@/lib/contratoTemplates";
import { TIPOS_CONTRATO } from "@/types/contratos";
import { FileText, Eye } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ModelosContrato() {
  const [previewModelo, setPreviewModelo] = useState<typeof MODELOS_CONTRATO[0] | null>(null);

  const getTipoLabel = (tipo: string) => {
    return TIPOS_CONTRATO.find(t => t.value === tipo)?.label || tipo;
  };

  return (
    <>
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
    </>
  );
}
