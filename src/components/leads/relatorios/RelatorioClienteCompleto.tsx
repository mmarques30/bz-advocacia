import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Mail, Link as LinkIcon } from "lucide-react";
import { ResumoClienteCard } from "./ResumoClienteCard";
import { SituacaoFinanceiraCard } from "./SituacaoFinanceiraCard";
import { RelatorioAndamentosRecentes } from "./RelatorioAndamentosRecentes";
import { RelatorioProximosVencimentos } from "./RelatorioProximosVencimentos";
import { RelatorioStatusProcessos } from "./RelatorioStatusProcessos";
import { toast } from "sonner";

interface RelatorioClienteCompletoProps {
  clienteId: string;
}

export function RelatorioClienteCompleto({ clienteId }: RelatorioClienteCompletoProps) {
  const handleExportPDF = () => {
    toast.info("Funcionalidade de exportação em desenvolvimento");
  };

  const handleEnviarEmail = () => {
    toast.info("Funcionalidade de envio por e-mail em desenvolvimento");
  };

  const handleCopiarLink = () => {
    toast.info("Funcionalidade de compartilhamento em desenvolvimento");
  };

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relatório do Cliente</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Resumo automático com todas as informações relevantes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleEnviarEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Enviar Email
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopiarLink}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Copiar Link
          </Button>
        </div>
      </div>

      {/* Dados do Cliente */}
      <ResumoClienteCard clienteId={clienteId} />

      {/* Situação Financeira */}
      <SituacaoFinanceiraCard clienteId={clienteId} />

      <Separator />

      {/* Andamentos Recentes */}
      <RelatorioAndamentosRecentes clienteId={clienteId} />

      <Separator />

      {/* Próximos Vencimentos */}
      <RelatorioProximosVencimentos clienteId={clienteId} />

      <Separator />

      {/* Status dos Processos */}
      <RelatorioStatusProcessos clienteId={clienteId} />
    </div>
  );
}
