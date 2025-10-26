import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDocumentosCliente } from "@/hooks/useRelatoriosCliente";
import { Download, Mail, Link as LinkIcon, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToPDF } from "@/lib/exportUtils";

interface RelatorioDocumentosDisponiveisProps {
  clienteId: string;
}

export function RelatorioDocumentosDisponiveis({ clienteId }: RelatorioDocumentosDisponiveisProps) {
  const { data: documentos, isLoading } = useDocumentosCliente(clienteId);

  const handleExportPDF = () => {
    exportToPDF(documentos, "Documentos Disponíveis");
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!documentos || documentos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum documento disponível
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documentos Disponíveis</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {documentos.length} documento(s) disponível(is)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Enviar Email
          </Button>
          <Button variant="outline" size="sm">
            <LinkIcon className="h-4 w-4 mr-2" />
            Copiar Link
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documentos.map((documento: any) => (
          <Card key={documento.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate mb-1">{documento.nome_arquivo}</h4>
                  <div className="space-y-1">
                    <Badge variant="secondary" className="text-xs">
                      {documento.categoria}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Processo: {documento.processo?.numero_processo || "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(documento.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
