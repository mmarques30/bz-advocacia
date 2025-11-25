import { DocumentoDrive, TIPO_DOCUMENTO_DRIVE_LABELS } from "@/types/documentos-drive";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, MoreVertical, Copy, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { gerarLinkVisualizacao } from "@/lib/driveUtils";
import { toast } from "@/hooks/use-toast";
import { ICONES_DOCUMENTO } from "@/lib/documentoIcons";

interface DriveDocumentoCardProps {
  documento: DocumentoDrive;
  onEdit: (documento: DocumentoDrive) => void;
  onDelete: (id: string) => void;
}

export function DriveDocumentoCard({ documento, onEdit, onDelete }: DriveDocumentoCardProps) {
  const handleAbrirDrive = () => {
    const url = gerarLinkVisualizacao(documento.drive_file_id);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopiarLink = () => {
    const url = gerarLinkVisualizacao(documento.drive_file_id);
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado",
      description: "O link do documento foi copiado para a área de transferência.",
    });
  };

  const IconeDocumento = ICONES_DOCUMENTO[documento.tipo_documento];

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <IconeDocumento className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm font-medium text-muted-foreground">
              {TIPO_DOCUMENTO_DRIVE_LABELS[documento.tipo_documento]}
            </span>
          </div>
          
          <h4 className="font-semibold mb-1 truncate">{documento.nome}</h4>
          
          {documento.descricao && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {documento.descricao}
            </p>
          )}
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span>Adicionado em {format(new Date(documento.created_at), "dd/MM/yyyy")}</span>
          </div>
          
          {documento.tags && documento.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {documento.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleAbrirDrive}
            className="w-full sm:w-auto"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir no Drive
          </Button>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(documento)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar informações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopiarLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar link
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(documento.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover do processo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
