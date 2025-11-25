import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { WhatsAppTemplate } from "@/types/whatsapp";
import { useDeleteWhatsAppTemplate, useToggleWhatsAppTemplateStatus } from "@/hooks/useWhatsAppTemplates";
import { Edit, MoreVertical, Power, Trash2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WhatsAppTemplateCardProps {
  template: WhatsAppTemplate;
  onEdit: (template: WhatsAppTemplate) => void;
}

export function WhatsAppTemplateCard({ template, onEdit }: WhatsAppTemplateCardProps) {
  const deleteTemplate = useDeleteWhatsAppTemplate();
  const toggleStatus = useToggleWhatsAppTemplateStatus();

  const categoriaLabels = {
    andamento: "Andamento",
    audiencia: "Audiência",
    sentenca: "Sentença",
    geral: "Geral",
    cobranca: "Cobrança",
    documento: "Documento",
    prazo: "Prazo",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-lg">{template.nome}</CardTitle>
            </div>
            <CardDescription>
              <Badge variant="secondary" className="text-xs">
                {categoriaLabels[template.categoria]}
              </Badge>
            </CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(template)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleStatus.mutate({ id: template.id, ativo: !template.ativo })}
              >
                <Power className="mr-2 h-4 w-4" />
                {template.ativo ? 'Desativar' : 'Ativar'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => deleteTemplate.mutate(template.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
            {template.mensagem}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="space-y-1">
              <div>Variáveis: {template.variaveis.length}</div>
              <div>Enviadas: {template.total_envios}</div>
            </div>
            <Badge variant={template.ativo ? "default" : "secondary"}>
              {template.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          
          {template.usado_ultima_vez && (
            <div className="text-xs text-muted-foreground">
              Último uso: {format(new Date(template.usado_ultima_vez), "dd/MM/yyyy", { locale: ptBR })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
