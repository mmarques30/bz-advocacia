import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Mail, MessageSquare, FileCheck, Pencil, Copy, Trash2 } from "lucide-react";
import { Template } from "@/hooks/useTemplates";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TemplateCardProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const tipoIcons = {
  documento: FileText,
  email: Mail,
  whatsapp: MessageSquare,
  contrato: FileCheck,
};

const tipoLabels = {
  documento: "Documento",
  email: "Email",
  whatsapp: "WhatsApp",
  contrato: "Contrato",
};

export function TemplateCard({ template, onEdit, onDuplicate, onDelete }: TemplateCardProps) {
  const Icon = tipoIcons[template.tipo];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{template.nome}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{tipoLabels[template.tipo]}</Badge>
                {template.categoria && <Badge variant="outline">{template.categoria}</Badge>}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {template.descricao && (
            <p className="text-sm text-muted-foreground">{template.descricao}</p>
          )}
          
          {template.variaveis && template.variaveis.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.variaveis.map((variavel) => (
                <Badge key={variavel} variant="outline" className="text-xs">
                  {`{{${variavel}}}`}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              Criado em {format(new Date(template.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(template)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDuplicate(template.id)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(template.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
