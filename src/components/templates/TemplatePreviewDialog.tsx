import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Template } from "@/types/templates";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, User, Tag } from "lucide-react";

interface TemplatePreviewDialogProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeLabels = {
  contrato: 'Contrato',
  procuracao: 'Procuração',
  peticao: 'Petição',
  email: 'Email',
  documento: 'Documento',
  comunicacao: 'Comunicação',
};

export default function TemplatePreviewDialog({ template, open, onOpenChange }: TemplatePreviewDialogProps) {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {template.nome}
            <Badge>{typeLabels[template.tipo]}</Badge>
            {template.categoria && (
              <Badge variant="outline">{template.categoria}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {template.descricao && (
            <div>
              <p className="text-sm text-muted-foreground">{template.descricao}</p>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Informações</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Criado em:</span>
                <span>{format(new Date(template.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Atualizado em:</span>
                <span>{format(new Date(template.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
            </div>
          </div>

          {template.variaveis && template.variaveis.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Variáveis utilizadas ({template.variaveis.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {template.variaveis.map(variavel => (
                    <Badge key={variavel} variant="secondary" className="font-mono text-xs">
                      {variavel}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Conteúdo</h3>
            <div className="bg-muted rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                {template.conteudo}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
