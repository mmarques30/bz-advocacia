import { Button } from "@/components/ui/button";
import { useAndamentosCliente } from "@/hooks/useRelatoriosCliente";
import { Download, Mail, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToPDF } from "@/lib/exportUtils";

interface RelatorioAndamentosRecentesProps {
  clienteId: string;
}

export function RelatorioAndamentosRecentes({ clienteId }: RelatorioAndamentosRecentesProps) {
  const { data: andamentos, isLoading } = useAndamentosCliente(clienteId);

  const handleExportPDF = () => {
    exportToPDF(andamentos, "Andamentos Recentes");
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!andamentos || andamentos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum andamento registrado
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Andamentos Recentes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Últimas {andamentos.length} movimentação(ões)
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

      <div className="space-y-4">
        {andamentos.map((andamento: any) => (
          <div
            key={andamento.id}
            className="border-l-4 border-primary pl-4 py-3 bg-muted/50 rounded-r-lg"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold">{andamento.tipo_andamento}</h4>
                <p className="text-sm text-muted-foreground">
                  Processo: {andamento.processo?.numero_processo || "N/A"}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">
                {format(new Date(andamento.data_andamento), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            <p className="text-sm">{andamento.descricao}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
