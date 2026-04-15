import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Edit, 
  Copy, 
  Eye, 
  Power,
  FileText,
  Mail,
  FileSignature,
  File,
  MessageSquare,
  Scale,
} from "lucide-react";
import type { Template } from "@/types/templates";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TemplateCardProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDuplicate: (id: string) => void;
  onPreview: (template: Template) => void;
  onToggleStatus: (id: string, ativo: boolean) => void;
}

const typeIcons = {
  contrato: Scale,
  procuracao: FileSignature,
  peticao: FileText,
  email: Mail,
  documento: File,
  comunicacao: MessageSquare,
};

const typeLabels = {
  contrato: 'Contrato',
  procuracao: 'Procuração',
  peticao: 'Petição',
  email: 'Email',
  documento: 'Documento',
  comunicacao: 'Comunicação',
};

export default function TemplateCard({
  template,
  onEdit,
  onDuplicate,
  onPreview,
  onToggleStatus,
}: TemplateCardProps) {
  const Icon = typeIcons[template.tipo];
  
  return (
    <Card className={!template.ativo ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-1">{template.nome}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{typeLabels[template.tipo]}</Badge>
                {template.categoria && (
                  <Badge variant="outline">{template.categoria}</Badge>
                )}
                {!template.ativo && (
                  <Badge variant="destructive">Inativo</Badge>
                )}
              </CardDescription>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir ações do template">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPreview(template)}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(template)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(template.id)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggleStatus(template.id, !template.ativo)}>
                <Power className="h-4 w-4 mr-2" />
                {template.ativo ? 'Desativar' : 'Ativar'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        {template.descricao && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {template.descricao}
          </p>
        )}
        
        <div className="bg-muted/50 rounded-md p-3 mb-3">
          <p className="text-xs text-muted-foreground line-clamp-3 font-mono">
            {template.conteudo}
          </p>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Atualizado em {format(new Date(template.updated_at), "dd/MM/yyyy", { locale: ptBR })}
          </span>
          {template.variaveis && template.variaveis.length > 0 && (
            <span>{template.variaveis.length} variáveis</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
